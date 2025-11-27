import asyncio
import time
from typing import List
from fastapi import WebSocket
from .fio import fetch_and_save_transactions
from .database import get_session_local, get_engine
from .config import get_config
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                # We might want to remove dead connections here, but disconnect() usually handles it
                pass

class FetchService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FetchService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        self.lock = asyncio.Lock()
        self.last_fetch_time = 0
        self.manager = ConnectionManager()
        self.initialized = True

    async def run_fetch(self):
        # Rate limiting
        now = time.time()
        if now - self.last_fetch_time < 30:
            remaining = 30 - (now - self.last_fetch_time)
            msg = f"Rate limit exceeded. Please wait {int(remaining)} seconds."
            await self.manager.broadcast({"status": "error", "message": msg})
            return {"status": "error", "message": msg}

        if self.lock.locked():
            msg = "Fetch already in progress."
            await self.manager.broadcast({"status": "error", "message": msg})
            return {"status": "error", "message": msg}

        async with self.lock:
            self.last_fetch_time = time.time()
            await self.manager.broadcast({"status": "started", "message": "Fetch started"})
            
            try:
                # Run sync fetch in threadpool
                loop = asyncio.get_event_loop()
                
                def progress_callback(current, total, message):
                    # This is called from a thread, so we need to schedule broadcast on the loop
                    # However, broadcast is async.
                    # We can use run_coroutine_threadsafe
                    asyncio.run_coroutine_threadsafe(
                        self.manager.broadcast({
                            "status": "progress", 
                            "current": current, 
                            "total": total, 
                            "message": message
                        }), 
                        loop
                    )

                def do_fetch():
                    config = get_config()
                    engine = get_engine(config.db_path)
                    SessionLocal = get_session_local(engine)
                    db = SessionLocal()
                    try:
                        return fetch_and_save_transactions(config.fio_token, db, progress_callback)
                    finally:
                        db.close()

                count = await loop.run_in_executor(None, do_fetch)
                
                await self.manager.broadcast({"status": "completed", "new_transactions": count, "message": "Fetch completed successfully"})
                return {"status": "success", "new_transactions": count}
                
            except Exception as e:
                logger.error(f"Fetch failed: {e}")
                await self.manager.broadcast({"status": "error", "message": str(e)})
                return {"status": "error", "message": str(e)}

fetch_service = FetchService()

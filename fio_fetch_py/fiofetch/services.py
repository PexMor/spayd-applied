import asyncio
import time
from typing import List
from fastapi import WebSocket
from .fio import fetch_and_save_transactions
from .config import get_config
from .utils import mask_token
import logging

logger = logging.getLogger(__name__)

# Import the shared database components getter from api
# This ensures we use the same engine across the application
def _get_shared_db_components():
    """Get the shared database components from api module."""
    from .api import _get_db_components
    return _get_db_components()

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
            await self.manager.broadcast({"status": "started", "message": "🚀 Fetch started..."})
            
            config = None  # Store config to access token for masking
            db = None
            
            try:
                # Progress callback for async function
                def progress_callback(current, total, message):
                    # Schedule broadcast on the event loop
                    asyncio.create_task(
                        self.manager.broadcast({
                            "status": "progress", 
                            "current": current, 
                            "total": total, 
                            "message": message
                        })
                    )

                # Setup database session (use shared engine)
                config = get_config()
                _, SessionLocal = _get_shared_db_components()
                db = SessionLocal()
                
                # Call async fetch function directly
                count = await fetch_and_save_transactions(
                    config.fio_token, 
                    db, 
                    progress_callback,
                    api_url=config.fio_api_url,
                    back_date_days=config.back_date_days
                )
                
                await self.manager.broadcast({"status": "completed", "new_transactions": count, "message": f"✅ Fetch completed! Saved {count} new transaction(s)."})
                return {"status": "success", "new_transactions": count}
                
            except Exception as e:
                # Mask token in error message before logging or broadcasting
                error_str = str(e)
                if config and config.fio_token:
                    error_str = mask_token(error_str, config.fio_token)
                
                logger.error(f"Fetch failed: {error_str}")
                error_message = f"❌ Fetch failed: {error_str}"
                await self.manager.broadcast({"status": "error", "message": error_message})
                return {"status": "error", "message": error_message}
            finally:
                if db:
                    # For scoped_session, use remove() for proper cleanup
                    _, SessionLocal = _get_shared_db_components()
                    SessionLocal.remove()

fetch_service = FetchService()

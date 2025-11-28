from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from .database import get_session_local
from .models import Transaction
from .config import get_config
import os
import asyncio

router = APIRouter()

# Dependency to get DB session
def get_db():
    config = get_config()
    from .database import get_engine
    engine = get_engine(config.db_path)
    SessionLocal = get_session_local(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TransactionOut(BaseModel):
    id: int
    transaction_id: str
    date: date
    amount: float
    currency: str
    counter_account: Optional[str]
    counter_account_name: Optional[str]
    bank_code: Optional[str]
    bank_name: Optional[str]
    constant_symbol: Optional[str]
    variable_symbol: Optional[str]
    specific_symbol: Optional[str]
    user_identification: Optional[str]
    message_for_recipient: Optional[str]
    type: Optional[str]
    executor: Optional[str]
    specification: Optional[str]
    comment: Optional[str]
    bic: Optional[str]
    instruction_id: Optional[str]
    payer_reference: Optional[str]

    class Config:
        from_attributes = True

class ConfigUpdate(BaseModel):
    fio_token: Optional[str] = None
    fio_api_url: Optional[str] = None

@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).offset(skip).limit(limit).all()
    return transactions

from fastapi import WebSocket, WebSocketDisconnect
from .services import fetch_service

@router.post("/fetch")
async def trigger_fetch():
    # Trigger background fetch
    # We don't await the result here if we want it to be truly background, 
    # but the user asked for a background process.
    # However, if we just fire and forget, we can't return the result.
    # But the user also asked for "notification websocket api".
    # So we can start the task and return immediately.
    
    # Actually, the user said "make the fetch ... a background process ... and has a notification websocket api".
    # And "request to the api should never be dispatched more than once every 30s".
    
    # If we use asyncio.create_task, it runs in background.
    asyncio.create_task(fetch_service.run_fetch())
    return {"message": "Fetch started in background. Connect to /api/v1/ws for progress."}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await fetch_service.manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        fetch_service.manager.disconnect(websocket)

@router.get("/config")
def get_current_config():
    config = get_config()
    # Mask token
    token = config.fio_token
    masked_token = None
    if token:
        masked_token = token[:4] + "*" * (len(token) - 8) + token[-4:] if len(token) > 8 else "****"
    
    return {
        "host": config.host,
        "port": config.port,
        "db_path": config.db_path,
        "fio_token": masked_token,
        "fio_api_url": config.fio_api_url,
        "static_dir": config.static_dir
    }

@router.post("/config")
def update_config(config_update: ConfigUpdate):
    # This is tricky because config is loaded from args/env/file.
    # Updating it "via web" implies saving it to the config file.
    # We need to read the config file, update it, and save it back.
    # For now, let's just update the config file at ~/.config/fio_fetch/config.yaml
    
    config_path = os.path.expanduser("~/.config/fio_fetch/config.yaml")
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    import yaml
    
    current_data = {}
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            current_data = yaml.safe_load(f) or {}
    
    # Only update fields that were provided
    # Note: YAML keys must match the command-line argument names with hyphens
    if config_update.fio_token is not None:
        current_data['fio-token'] = config_update.fio_token
    
    if config_update.fio_api_url is not None:
        current_data['fio-api-url'] = config_update.fio_api_url
    
    with open(config_path, 'w') as f:
        yaml.dump(current_data, f)
        
    return {"message": "Configuration updated. Please restart the server for changes to take effect."}

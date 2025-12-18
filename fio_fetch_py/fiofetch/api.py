from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from .database import get_session_local
from .models import Transaction, MatchingData
from .config import get_config
from .utils import mask_token
import os
import asyncio
import logging
import aiohttp
import json

logger = logging.getLogger(__name__)

router = APIRouter()

# Singleton for database engine and session factory
_db_engine = None
_db_session_local = None

def _get_db_components():
    """Get or create the database engine and session factory (singleton)."""
    global _db_engine, _db_session_local
    if _db_engine is None or _db_session_local is None:
        config = get_config()
        from .database import get_engine
        _db_engine = get_engine(config.db_path)
        _db_session_local = get_session_local(_db_engine)
        logger.info(f"Database initialized: {config.db_path}")
    return _db_engine, _db_session_local

# Dependency to get DB session
def get_db():
    _, SessionLocal = _get_db_components()
    db = SessionLocal()
    try:
        yield db
    finally:
        # For scoped_session, use remove() to properly clean up
        SessionLocal.remove()

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
    back_date_days: Optional[int] = None

def get_matched_transaction_ids(db: Session, debug: bool = False) -> set:
    """Get IDs of transactions that match the matching data."""
    def normalize_symbol(value):
        """Normalize symbol value - treat null, empty, '-', 'null', 'N/A' as empty."""
        if value is None:
            return ''
        s = str(value).strip()
        if s == '' or s == '-' or s.lower() in ('null', 'undefined', 'n/a'):
            return ''
        return s
    
    matched_ids = set()
    matching_entries = db.query(MatchingData).all()
    
    if not matching_entries:
        if debug:
            logger.debug("No matching entries found")
        return matched_ids
    
    transactions = db.query(Transaction).all()
    
    if debug:
        logger.debug(f"Checking {len(matching_entries)} matching entries against {len(transactions)} transactions")
    
    for entry in matching_entries:
        entry_vs = normalize_symbol(entry.variable_symbol)
        entry_ss = normalize_symbol(entry.specific_symbol)
        
        # Skip entries that don't have both VS and SS
        if not entry_vs or not entry_ss:
            if debug:
                logger.debug(f"Skipping entry (missing VS or SS): VS='{entry.variable_symbol}' SS='{entry.specific_symbol}'")
            continue
        
        for tx in transactions:
            tx_vs = normalize_symbol(tx.variable_symbol)
            tx_ss = normalize_symbol(tx.specific_symbol)
            
            # Transaction must have both VS and SS
            if not tx_vs or not tx_ss:
                continue
            
            # VS and SS must both match exactly
            if entry_vs != tx_vs or entry_ss != tx_ss:
                continue
            
            # KS is optional
            entry_ks = normalize_symbol(entry.constant_symbol)
            if entry_ks:
                tx_ks = normalize_symbol(tx.constant_symbol)
                if not tx_ks or entry_ks != tx_ks:
                    continue
            
            if debug:
                logger.debug(f"MATCH: tx.id={tx.id} VS={tx_vs} SS={tx_ss} matched entry VS={entry_vs} SS={entry_ss}")
            matched_ids.add(tx.id)
    
    if debug:
        logger.debug(f"Total matched transaction IDs: {matched_ids}")
    
    return matched_ids

@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    variable_symbol: Optional[str] = Query(None, description="Filter by Variable Symbol (substring match)"),
    specific_symbol: Optional[str] = Query(None, description="Filter by Specific Symbol (substring match)"),
    constant_symbol: Optional[str] = Query(None, description="Filter by Constant Symbol (substring match)"),
    counter_account: Optional[str] = Query(None, description="Filter by Counter Account (substring match)"),
    counter_account_name: Optional[str] = Query(None, description="Filter by Counter Account Name (substring match)"),
    bank_code: Optional[str] = Query(None, description="Filter by Bank Code (substring match)"),
    bank_name: Optional[str] = Query(None, description="Filter by Bank Name (substring match)"),
    executor: Optional[str] = Query(None, description="Filter by Executor (substring match)"),
    transaction_id: Optional[str] = Query(None, description="Filter by Transaction ID (substring match)"),
    hide_matched: bool = Query(False, description="Hide transactions that match the matching data"),
    db: Session = Depends(get_db)
):
    """
    List transactions with advanced filtering and pagination.
    All filter parameters support substring matching (case-insensitive).
    """
    query = db.query(Transaction)
    
    # Filter out matched transactions if requested
    if hide_matched:
        matched_ids = get_matched_transaction_ids(db, debug=True)
        logger.info(f"[list_transactions] hide_matched=True, filtering out {len(matched_ids)} IDs: {matched_ids}")
        if matched_ids:
            query = query.filter(~Transaction.id.in_(matched_ids))
    
    # Apply filters with substring matching (case-insensitive)
    if variable_symbol:
        query = query.filter(Transaction.variable_symbol.ilike(f"%{variable_symbol}%"))
    
    if specific_symbol:
        query = query.filter(Transaction.specific_symbol.ilike(f"%{specific_symbol}%"))
    
    if constant_symbol:
        query = query.filter(Transaction.constant_symbol.ilike(f"%{constant_symbol}%"))
    
    if counter_account:
        query = query.filter(Transaction.counter_account.ilike(f"%{counter_account}%"))
    
    if counter_account_name:
        query = query.filter(Transaction.counter_account_name.ilike(f"%{counter_account_name}%"))
    
    if bank_code:
        query = query.filter(Transaction.bank_code.ilike(f"%{bank_code}%"))
    
    if bank_name:
        query = query.filter(Transaction.bank_name.ilike(f"%{bank_name}%"))
    
    if executor:
        query = query.filter(Transaction.executor.ilike(f"%{executor}%"))
    
    if transaction_id:
        query = query.filter(Transaction.transaction_id.ilike(f"%{transaction_id}%"))
    
    # Apply pagination
    transactions = query.order_by(Transaction.date.desc(), Transaction.id.desc()).offset(skip).limit(limit).all()
    
    return transactions

@router.get("/transactions/count")
def get_transactions_count(
    variable_symbol: Optional[str] = Query(None, description="Filter by Variable Symbol (substring match)"),
    specific_symbol: Optional[str] = Query(None, description="Filter by Specific Symbol (substring match)"),
    constant_symbol: Optional[str] = Query(None, description="Filter by Constant Symbol (substring match)"),
    counter_account: Optional[str] = Query(None, description="Filter by Counter Account (substring match)"),
    counter_account_name: Optional[str] = Query(None, description="Filter by Counter Account Name (substring match)"),
    bank_code: Optional[str] = Query(None, description="Filter by Bank Code (substring match)"),
    bank_name: Optional[str] = Query(None, description="Filter by Bank Name (substring match)"),
    executor: Optional[str] = Query(None, description="Filter by Executor (substring match)"),
    transaction_id: Optional[str] = Query(None, description="Filter by Transaction ID (substring match)"),
    hide_matched: bool = Query(False, description="Hide transactions that match the matching data"),
    db: Session = Depends(get_db)
):
    """
    Get total count of transactions matching the filters.
    Useful for pagination.
    """
    query = db.query(Transaction)
    
    # Filter out matched transactions if requested
    if hide_matched:
        matched_ids = get_matched_transaction_ids(db, debug=True)
        logger.info(f"[count] hide_matched=True, filtering out {len(matched_ids)} IDs: {matched_ids}")
        if matched_ids:
            query = query.filter(~Transaction.id.in_(matched_ids))
    
    # Apply the same filters as list_transactions
    if variable_symbol:
        query = query.filter(Transaction.variable_symbol.ilike(f"%{variable_symbol}%"))
    
    if specific_symbol:
        query = query.filter(Transaction.specific_symbol.ilike(f"%{specific_symbol}%"))
    
    if constant_symbol:
        query = query.filter(Transaction.constant_symbol.ilike(f"%{constant_symbol}%"))
    
    if counter_account:
        query = query.filter(Transaction.counter_account.ilike(f"%{counter_account}%"))
    
    if counter_account_name:
        query = query.filter(Transaction.counter_account_name.ilike(f"%{counter_account_name}%"))
    
    if bank_code:
        query = query.filter(Transaction.bank_code.ilike(f"%{bank_code}%"))
    
    if bank_name:
        query = query.filter(Transaction.bank_name.ilike(f"%{bank_name}%"))
    
    if executor:
        query = query.filter(Transaction.executor.ilike(f"%{executor}%"))
    
    if transaction_id:
        query = query.filter(Transaction.transaction_id.ilike(f"%{transaction_id}%"))
    
    count = query.count()
    
    return {"count": count}

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
        "back_date_days": config.back_date_days,
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
    
    if config_update.back_date_days is not None:
        current_data['back-date-days'] = config_update.back_date_days
    
    with open(config_path, 'w') as f:
        yaml.dump(current_data, f)
        
    return {"message": "Configuration updated. Please restart the server for changes to take effect."}

class SetLastDateRequest(BaseModel):
    days_back: Optional[int] = None  # If not provided, use config default

@router.post("/set-last-date")
async def set_last_date(request: SetLastDateRequest):
    """
    Set the last date (zarážka) in Fio API to prevent going too far back in history.
    This helps prevent 422 errors when the history is too long.
    """
    config = get_config()
    
    if not config.fio_token:
        raise HTTPException(
            status_code=400, 
            detail="Fio token not configured. Please configure your token in the Configuration section."
        )
    
    # Use provided days_back or default from config
    days_back = request.days_back if request.days_back is not None else config.back_date_days
    
    # Validate days_back
    if days_back < 1 or days_back > 365:
        raise HTTPException(
            status_code=400,
            detail="Days back must be between 1 and 365"
        )
    
    # Calculate the target date
    target_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    
    # Call Fio API to set last date
    # Format: {api_url}/set-last-date/{token}/{rrrr-mm-dd}/
    # Use api_url from config instead of hardcoded URL
    base_url = config.fio_api_url.rstrip('/')
    set_last_date_url = f"{base_url}/set-last-date/{config.fio_token}/{target_date}/"
    
    try:
        logger.info(f"Setting last date to {target_date} ({days_back} days back)")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(set_last_date_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                response_text = await response.text()
                logger.debug(f"Response status: {response.status}")
                logger.debug(f"Response text: {response_text}")
                
                if response.status == 409:
                    error_msg = "Fio API rate limit exceeded. Please wait at least 30 seconds between requests."
                    raise HTTPException(status_code=409, detail=error_msg)
                elif response.status in [401, 403]:
                    error_msg = "Invalid Fio API token. Please check your token configuration."
                    raise HTTPException(status_code=response.status, detail=error_msg)
                elif response.status != 200:
                    error_msg = f"Fio API returned an error (status {response.status})"
                    masked_error = mask_token(response_text, config.fio_token)
                    logger.error(f"{error_msg}: {masked_error}")
                    raise HTTPException(status_code=response.status, detail=error_msg)
        
        logger.info("Successfully set last date in Fio API")
        return {
            "message": f"Successfully set last date to {target_date} ({days_back} days back)",
            "target_date": target_date,
            "days_back": days_back
        }
    except asyncio.TimeoutError:
        error_msg = "Request to Fio API timed out. Please try again later."
        logger.error(error_msg)
        raise HTTPException(status_code=504, detail=error_msg)
    except aiohttp.ClientConnectionError as e:
        error_msg = "Could not connect to Fio API. Please check your internet connection."
        masked_error = mask_token(str(e), config.fio_token)
        logger.error(f"{error_msg} Error: {masked_error}")
        raise HTTPException(status_code=503, detail=error_msg)
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        # Mask token in error message
        masked_error = mask_token(str(e), config.fio_token)
        error_msg = f"Failed to communicate with Fio API: {masked_error}"
        logger.error(error_msg)
        # Don't expose the full error to the client, just a generic message
        raise HTTPException(status_code=500, detail="Failed to communicate with Fio API. Check server logs for details.")

@router.delete("/transactions")
def delete_all_transactions(db: Session = Depends(get_db)):
    """
    Delete all transactions from the database.
    This is a destructive operation and cannot be undone.
    """
    try:
        count = db.query(Transaction).count()
        db.query(Transaction).delete()
        db.commit()
        logger.info(f"Deleted {count} transaction(s) from database")
        return {
            "message": f"Successfully deleted {count} transaction(s)",
            "deleted_count": count
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete transactions: {str(e)}")

# Matching Data Models
class MatchingDataRow(BaseModel):
    variable_symbol: Optional[str] = None
    specific_symbol: Optional[str] = None
    constant_symbol: Optional[str] = None
    row_data: Optional[Dict[str, Any]] = None

class MatchingDataUpload(BaseModel):
    rows: List[MatchingDataRow]

class MatchingDataOut(BaseModel):
    id: int
    variable_symbol: Optional[str]
    specific_symbol: Optional[str]
    constant_symbol: Optional[str]
    row_data: Optional[str]
    created_at: date

    class Config:
        from_attributes = True

# Matching Data Endpoints
@router.post("/matching-data")
def upload_matching_data(data: MatchingDataUpload, db: Session = Depends(get_db)):
    """
    Upload matching data from a file (CSV/TSV/XLSX processed in frontend).
    This will replace all existing matching data.
    """
    try:
        # Delete existing matching data
        db.query(MatchingData).delete()
        
        # Insert new matching data
        today = date.today()
        for row in data.rows:
            matching_entry = MatchingData(
                variable_symbol=row.variable_symbol,
                specific_symbol=row.specific_symbol,
                constant_symbol=row.constant_symbol,
                row_data=json.dumps(row.row_data) if row.row_data else None,
                created_at=today
            )
            db.add(matching_entry)
        
        db.commit()
        count = len(data.rows)
        logger.info(f"Uploaded {count} matching data row(s)")
        
        return {
            "message": f"Successfully uploaded {count} matching data row(s)",
            "count": count
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to upload matching data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload matching data: {str(e)}")

@router.get("/matching-data", response_model=List[MatchingDataOut])
def get_matching_data(db: Session = Depends(get_db)):
    """
    Get all matching data entries.
    """
    try:
        matching_data = db.query(MatchingData).all()
        return matching_data
    except Exception as e:
        logger.error(f"Failed to get matching data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get matching data: {str(e)}")

@router.get("/matching-data/stats")
def get_matching_stats(db: Session = Depends(get_db)):
    """
    Get statistics about matching data and how many transactions match.
    """
    try:
        total_matching_rows = db.query(MatchingData).count()
        
        if total_matching_rows == 0:
            return {
                "total_matching_rows": 0,
                "matched_transactions": 0,
                "matched_ids": [],
                "total_transactions": db.query(Transaction).count()
            }
        
        # Use the shared get_matched_transaction_ids function
        matched_transaction_ids = get_matched_transaction_ids(db, debug=True)
        total_transactions = db.query(Transaction).count()
        
        logger.info(f"[stats] Matched IDs: {matched_transaction_ids}")
        
        return {
            "total_matching_rows": total_matching_rows,
            "matched_ids": list(matched_transaction_ids),  # Include IDs for debugging
            "matched_transactions": len(matched_transaction_ids),
            "total_transactions": total_transactions
        }
    except Exception as e:
        logger.error(f"Failed to get matching stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get matching stats: {str(e)}")

@router.delete("/matching-data")
def delete_matching_data(db: Session = Depends(get_db)):
    """
    Delete all matching data.
    """
    try:
        count = db.query(MatchingData).count()
        db.query(MatchingData).delete()
        db.commit()
        logger.info(f"Deleted {count} matching data row(s)")
        return {
            "message": f"Successfully deleted {count} matching data row(s)",
            "deleted_count": count
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete matching data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete matching data: {str(e)}")

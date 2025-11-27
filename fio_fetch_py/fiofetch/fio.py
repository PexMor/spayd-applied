from fiobank import FioBank
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from .models import Transaction
import logging

logger = logging.getLogger(__name__)

def fetch_and_save_transactions(token: str, session: Session, progress_callback=None):
    if not token:
        logger.warning("No Fio token provided. Skipping fetch.")
        if progress_callback:
            progress_callback(0, 0, "No token provided")
        return 0

    if progress_callback:
        progress_callback(0, 0, "Connecting to Fio bank...")

    client = FioBank(token)
    
    try:
        # We convert to list to know the total count for progress
        transactions = list(client.last())
    except Exception as e:
        logger.error(f"Error fetching transactions from Fio: {e}")
        if progress_callback:
            progress_callback(0, 0, f"Error: {str(e)}")
        raise e

    total = len(transactions)
    if progress_callback:
        progress_callback(0, total, f"Fetched {total} transactions. Saving...")

    saved_count = 0
    for i, tr_data in enumerate(transactions):
        # Map fiobank data to our model
        
        # Helper to safely get value
        def get_val(key):
            return tr_data.get(key)

        transaction_id = str(get_val('transaction_id'))
        
        # check if exists
        if session.query(Transaction).filter_by(transaction_id=transaction_id).first():
            if progress_callback and i % 10 == 0: # Update every 10 items to avoid too much noise
                 progress_callback(i + 1, total, "Processing...")
            continue

        new_tr = Transaction(
            transaction_id=transaction_id,
            date=get_val('date'),
            amount=get_val('amount'),
            currency=get_val('currency'),
            counter_account=get_val('account_number'),
            counter_account_name=get_val('account_name'),
            bank_code=get_val('bank_code'),
            bank_name=get_val('bank_name'),
            constant_symbol=get_val('constant_symbol'),
            variable_symbol=get_val('variable_symbol'),
            specific_symbol=get_val('specific_symbol'),
            user_identification=get_val('user_identification'),
            message_for_recipient=get_val('recipient_message'),
            type=get_val('type'),
            executor=get_val('executor'),
            specification=get_val('specification'),
            comment=get_val('comment'),
            bic=get_val('bic'),
            instruction_id=str(get_val('instruction_id')) if get_val('instruction_id') else None,
            payer_reference=None
        )
        
        session.add(new_tr)
        saved_count += 1
        
        if progress_callback and i % 5 == 0:
             progress_callback(i + 1, total, "Saving...")
    
    try:
        session.commit()
        if progress_callback:
            progress_callback(total, total, f"Done. Saved {saved_count} new transactions.")
    except IntegrityError:
        session.rollback()
        logger.error("Integrity error during commit.")
        if progress_callback:
            progress_callback(total, total, "Error saving to database.")
        raise

    return saved_count

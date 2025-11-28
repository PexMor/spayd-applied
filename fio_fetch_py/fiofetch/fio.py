from fiobank import FioBank
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date as date_type
from .models import Transaction
import logging
import json
import os

logger = logging.getLogger(__name__)

def mask_token_in_string(text: str, token: str) -> str:
    """Mask token in strings to prevent exposure in logs."""
    if not token or not text:
        return text
    return text.replace(token, '<token>')

def load_example_transactions():
    """Load transactions from the example JSON file."""
    # Get the path to the examples directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    example_file = os.path.join(current_dir, '..', 'examples', 'tr.json')
    
    with open(example_file, 'r') as f:
        data = json.load(f)
    
    # Parse the Fio API JSON format
    transactions = []
    transaction_list = data.get('accountStatement', {}).get('transactionList', {}).get('transaction', [])
    
    for tr in transaction_list:
        # Extract values from the column structure
        def get_column_value(col_name):
            col = tr.get(col_name)
            return col.get('value') if col else None
        
        # Convert timestamp to date
        date_ms = get_column_value('column0')
        trans_date = datetime.fromtimestamp(date_ms / 1000).date() if date_ms else None
        
        transaction_data = {
            'transaction_id': str(get_column_value('column22')),
            'date': trans_date,
            'amount': get_column_value('column1'),
            'currency': get_column_value('column14'),
            'account_number': get_column_value('column2'),
            'account_name': get_column_value('column10'),
            'bank_code': get_column_value('column3'),
            'bank_name': get_column_value('column12'),
            'constant_symbol': get_column_value('column4'),
            'variable_symbol': get_column_value('column5'),
            'specific_symbol': get_column_value('column6'),
            'user_identification': get_column_value('column7'),
            'recipient_message': get_column_value('column16'),
            'type': get_column_value('column8'),
            'executor': get_column_value('column9'),
            'specification': get_column_value('column18'),
            'comment': get_column_value('column25'),
            'bic': get_column_value('column26'),
            'instruction_id': get_column_value('column17')
        }
        transactions.append(transaction_data)
    
    return transactions


def fetch_and_save_transactions(token: str, session: Session, progress_callback=None, api_url: str = None):
    if not token:
        logger.warning("No Fio token provided. Using example data from tr.json.")
        if progress_callback:
            progress_callback(0, 0, "⚠️ No token provided. Loading example data from tr.json...")
        
        try:
            transactions = load_example_transactions()
        except Exception as e:
            logger.error(f"Error loading example data: {e}")
            if progress_callback:
                progress_callback(0, 0, f"Error loading example data: {str(e)}")
            raise e
    else:
        if progress_callback:
            if api_url and api_url != 'https://www.fioapi.cz/v1/rest':
                progress_callback(0, 0, f"Connecting to custom API: {api_url}...")
            else:
                progress_callback(0, 0, "Connecting to Fio bank...")

        # Create FioBank client with custom URL if provided
        try:
            if api_url:
                # Try to create with base_url parameter (some versions support this)
                client = FioBank(token=token, base_url=api_url)
            else:
                client = FioBank(token)
        except TypeError:
            # If base_url is not supported, fall back to standard initialization
            logger.warning("FioBank library doesn't support base_url parameter. Using default URL.")
            if progress_callback:
                progress_callback(0, 0, "⚠️ Custom API URL not supported by library. Using default...")
            client = FioBank(token)
        
        try:
            # We convert to list to know the total count for progress
            transactions = list(client.last())
        except Exception as e:
            # Mask token in error message before logging
            error_str = mask_token_in_string(str(e), token)
            logger.error(f"Error fetching transactions from Fio: {error_str}")
            # Don't send progress_callback here - let the exception propagate
            # to services.py where it will be properly formatted and sent via websocket
            raise e

    total = len(transactions)
    if progress_callback:
        if not token:
            progress_callback(0, total, f"📋 Loaded {total} example transactions. Saving...")
        else:
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
            if not token:
                progress_callback(total, total, f"✅ Done. Saved {saved_count} new example transactions.")
            else:
                progress_callback(total, total, f"Done. Saved {saved_count} new transactions.")
    except IntegrityError:
        session.rollback()
        logger.error("Integrity error during commit.")
        if progress_callback:
            progress_callback(total, total, "Error saving to database.")
        raise

    return saved_count

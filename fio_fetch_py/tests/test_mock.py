import json
import os
import sys
import pytest
from unittest.mock import patch
from datetime import date

# Import without triggering config parsing
from fiofetch.database import get_engine, init_db, get_session_local
from fiofetch.models import Transaction

@pytest.fixture
def db_session():
    db_path = 'test_fio_pytest.db'
    if os.path.exists(db_path):
        os.remove(db_path)

    engine = get_engine(db_path)
    init_db(engine)
    SessionLocal = get_session_local(engine)
    session = SessionLocal()
    yield session
    session.close()
    if os.path.exists(db_path):
        os.remove(db_path)

def test_fetch_and_save_mock(db_session):
    # Import here to avoid import-time config issues
    from fiofetch.fio import fetch_and_save_transactions
    
    # Load the example JSON
    with open('examples/tr.json', 'r') as f:
        data = json.load(f)

    raw_transactions = data['accountStatement']['transactionList']['transaction']

    # Map raw JSON to what fiobank yields
    mock_transactions = []
    for tr in raw_transactions:
        def get_val(col_id):
            col = tr.get(f'column{col_id}')
            return col['value'] if col else None

        d_ts = get_val(0)
        d_date = date.fromtimestamp(d_ts / 1000) if d_ts else None

        mock_tr = {
            'transaction_id': get_val(22),
            'date': d_date,
            'amount': get_val(1),
            'currency': get_val(14),
            'account_number': get_val(2),
            'account_name': get_val(10),
            'bank_code': get_val(3),
            'bank_name': get_val(12),
            'constant_symbol': get_val(4),
            'variable_symbol': get_val(5),
            'specific_symbol': get_val(6),
            'user_identification': get_val(7),
            'recipient_message': get_val(16),
            'type': get_val(8),
            'executor': get_val(9),
            'specification': get_val(18),
            'comment': get_val(25),
            'bic': get_val(26),
            'instruction_id': get_val(17),
        }
        mock_transactions.append(mock_tr)

    # Mock FioBank
    with patch('fiofetch.fio.FioBank') as MockFioBank:
        instance = MockFioBank.return_value
        instance.last.return_value = mock_transactions
        
        # First fetch
        count = fetch_and_save_transactions('dummy_token', db_session)
        assert count == 3
        
        saved_trs = db_session.query(Transaction).all()
        assert len(saved_trs) == 3
        
        # Verify specific transaction
        tr = db_session.query(Transaction).filter_by(transaction_id="1148734530").first()
        assert tr is not None
        assert tr.amount == 1.0
        assert tr.currency == "CZK"
        assert tr.date == date(2012, 6, 26)

        # Verify deduplication
        count = fetch_and_save_transactions('dummy_token', db_session)
        assert count == 0
        
        final_count = db_session.query(Transaction).count()
        assert final_count == 3

from sqlalchemy import Column, Integer, String, Float, Date, Text
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False) # Column22 ID pohybu
    date = Column(Date, nullable=False) # Column0 Datum
    amount = Column(Float, nullable=False) # Column1 Objem
    currency = Column(String, nullable=False) # Column14 Měna
    counter_account = Column(String, nullable=True) # Column2 Protiúčet
    counter_account_name = Column(String, nullable=True) # Column10 Název protiúčtu
    bank_code = Column(String, nullable=True) # Column3 Kód banky
    bank_name = Column(String, nullable=True) # Column12 Název banky
    constant_symbol = Column(String, nullable=True) # Column4 KS
    variable_symbol = Column(String, nullable=True) # Column5 VS
    specific_symbol = Column(String, nullable=True) # Column6 SS
    user_identification = Column(String, nullable=True) # Column7 Uživatelská identifikace
    message_for_recipient = Column(String, nullable=True) # Column16 Zpráva pro příjemce
    type = Column(String, nullable=True) # Column8 Typ pohybu
    executor = Column(String, nullable=True) # Column9 Provedl
    specification = Column(String, nullable=True) # Column18 Upřesnění
    comment = Column(String, nullable=True) # Column25 Komentář
    bic = Column(String, nullable=True) # Column26 BIC
    instruction_id = Column(String, nullable=True) # Column17 ID pokynu
    payer_reference = Column(String, nullable=True) # Column27 Reference plátce

class MatchingData(Base):
    __tablename__ = "matching_data"

    id = Column(Integer, primary_key=True, index=True)
    variable_symbol = Column(String, nullable=True, index=True)
    specific_symbol = Column(String, nullable=True, index=True)
    constant_symbol = Column(String, nullable=True, index=True)
    row_data = Column(Text, nullable=True)  # Store full row data as JSON string for reference
    created_at = Column(Date, nullable=False)  # When this matching entry was created

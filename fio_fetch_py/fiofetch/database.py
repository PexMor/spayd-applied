from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

def get_engine(db_path: str):
    return create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

def get_session_local(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db(engine):
    Base.metadata.create_all(bind=engine)

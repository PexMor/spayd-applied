from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session

Base = declarative_base()

def get_engine(db_path: str):
    engine = create_engine(
        f"sqlite:///{db_path}",
        connect_args={
            "check_same_thread": False,
            "timeout": 30,  # Wait up to 30 seconds for locks
        },
        pool_pre_ping=True,  # Check connection is valid before using
        pool_size=5,
        max_overflow=10,
    )
    
    # Enable WAL mode for better concurrency
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")  # 30 seconds
        cursor.close()
    
    return engine

def get_session_local(engine):
    # Use scoped_session for thread-safe sessions
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return scoped_session(session_factory)

def init_db(engine):
    Base.metadata.create_all(bind=engine)

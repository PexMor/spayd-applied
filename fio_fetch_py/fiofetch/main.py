from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .api import router
from .config import get_config
from .database import get_engine, init_db
import os

def create_app():
    config = get_config()
    
    # Init DB
    engine = get_engine(config.db_path)
    init_db(engine)
    
    app = FastAPI(title="Fio Fetch API")
    
    app.include_router(router, prefix="/api/v1")
    
    # Mount static files
    if not os.path.exists(config.static_dir):
        os.makedirs(config.static_dir, exist_ok=True)
        # Create a dummy index.html if empty
        with open(os.path.join(config.static_dir, "index.html"), "w") as f:
            f.write("<h1>Fio Fetch Web UI</h1><p>Welcome to Fio Fetch. Use the API to interact.</p>")
            
    app.mount("/", StaticFiles(directory=config.static_dir, html=True), name="static")
    
    return app

app = create_app()

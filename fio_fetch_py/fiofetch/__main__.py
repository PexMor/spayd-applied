import uvicorn
import logging
from .config import get_config

def main():
    config = get_config()
    
    # Configure uvicorn to use DEBUG level for all loggers
    # This will show our application logs as well
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["loggers"]["fiofetch"] = {
        "handlers": ["default"],
        "level": "INFO",
    }
    
    uvicorn.run(
        "fiofetch.main:app", 
        host=config.host, 
        port=config.port, 
        reload=True,
        log_level="info",
        log_config=log_config
    )

if __name__ == "__main__":
    main()

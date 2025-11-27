import uvicorn
from .config import get_config

def main():
    config = get_config()
    uvicorn.run("fiofetch.main:app", host=config.host, port=config.port, reload=True)

if __name__ == "__main__":
    main()

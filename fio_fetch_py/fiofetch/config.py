import os
import configargparse
from pathlib import Path

def get_config():
    p = configargparse.ArgParser(default_config_files=['~/.config/fio_fetch/config.yaml'])
    
    p.add('-c', '--config', required=False, is_config_file=True, help='config file path')
    p.add('--host', default='0.0.0.0', env_var='FIO_FETCH_HOST', help='Host to bind to')
    p.add('--port', default=3000, type=int, env_var='FIO_FETCH_PORT', help='Port to bind to')
    p.add('--db-path', default='~/.config/fio_fetch/fio.db', env_var='FIO_FETCH_DB_PATH', help='Path to SQLite database')
    p.add('--fio-token', required=False, env_var='FIO_FETCH_TOKEN', help='Fio Bank API Token')
    p.add('--static-dir', default='static', env_var='FIO_FETCH_STATIC_DIR', help='Directory for static files')
    
    options = p.parse_args()
    
    # Expand user paths
    options.db_path = os.path.expanduser(options.db_path)
    if options.static_dir:
        options.static_dir = os.path.expanduser(options.static_dir)
        
    # Create config dir if it doesn't exist (for the db)
    db_dir = os.path.dirname(options.db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    return options

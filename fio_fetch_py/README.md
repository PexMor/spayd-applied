# Czech Fio Bank Fetch

A FastAPI-based web application for fetching and managing transactions from the Czech Fio Bank API.

## Features

- Fetch transactions from Fio Bank API
- Store transactions in a SQLite database
- RESTful API for accessing transaction data
- WebSocket support for real-time updates
- Serves a web UI for easy interaction

## Installation

Install the package using `uv` or `pip`:

```bash
# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
```

## Usage

### Running the Server

After installation, run the server using the `fiofetch` command:

```bash
fiofetch
```

By default, the server will start on `http://0.0.0.0:3000`.

### Configuration Options

The application can be configured using command-line arguments, environment variables, or a config file:

```bash
fiofetch --host 0.0.0.0 --port 3000 --fio-token YOUR_TOKEN --static-dir ../fio_fetch_webui/dist
```

Available options:

- `--host`: Host to bind to (default: `0.0.0.0`, env: `FIO_FETCH_HOST`)
- `--port`: Port to bind to (default: `3000`, env: `FIO_FETCH_PORT`)
- `--db-path`: Path to SQLite database (default: `~/.config/fio_fetch/fio.db`, env: `FIO_FETCH_DB_PATH`)
- `--fio-token`: Fio Bank API token (required for API access, env: `FIO_FETCH_TOKEN`)
- `--fio-api-url`: Fio Bank API base URL (default: `https://fioapi.fio.cz/v1/rest`, env: `FIO_FETCH_API_URL`)
- `--static-dir`: Directory for static files (default: `static`, env: `FIO_FETCH_STATIC_DIR`)
- `-c, --config`: Path to config file (default: `~/.config/fio_fetch/config.yaml`)

### Serving the Web UI

To serve the complete web application with the UI, point the `--static-dir` to the `fio_fetch_webui/dist` folder:

```bash
# From the fio_fetch_py directory
fiofetch --static-dir ../fio_fetch_webui/dist

# Or using environment variable
export FIO_FETCH_STATIC_DIR=../fio_fetch_webui/dist
fiofetch

# Or using absolute path
fiofetch --static-dir /path/to/spayd-applied/fio_fetch_webui/dist
```

Then open your browser and navigate to `http://localhost:3000` to access the web UI.

### Using a Configuration File

Create a config file at `~/.config/fio_fetch/config.yaml`:

```yaml
host: 0.0.0.0
port: 3000
fio-token: YOUR_FIO_BANK_TOKEN
static-dir: ../fio_fetch_webui/dist
db-path: ~/.config/fio_fetch/fio.db
```

Then simply run:

```bash
fiofetch
```

## API Endpoints

The API is available at `/api/v1` and includes endpoints for:

- Transaction management
- Account information
- Real-time updates via WebSocket
- **Back Date Days (History Limit)** - Set the last date to prevent 422 errors

API documentation is available at `http://localhost:3000/docs` (Swagger UI).

### Back Date Days (History Limit) Feature

To prevent 422 errors when fetching transactions, you can set a history limit (known as "zarážka" in Czech) that tells the Fio API how far back to search:

```bash
# Via API
curl -X POST "http://localhost:3000/api/v1/set-last-date" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 3}'
```

Or use the Web UI: **Fetch Control → Set History Limit**

See [back_date_days_SETUP.md](back_date_days_SETUP.md) for detailed documentation.

## Development

To run tests:

```bash
# Using uv
uv run pytest

# Or using pytest directly
pytest
```

## Requirements

- Python >= 3.13
- Dependencies are managed via `pyproject.toml`

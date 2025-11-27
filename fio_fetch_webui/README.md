# FioFetch Web UI

A modern web interface for the FioFetch API - a transaction management system for Fio Bank.

## Features

- 📊 **Dashboard** - Overview of transactions with statistics
- 💰 **Transaction List** - Browse and search transactions with pagination
- 🔄 **Fetch Control** - Manual fetch trigger with WebSocket real-time progress
- ⚙️ **Configuration** - Manage API token and view system settings
- 🌙 **Dark Mode** - Automatic dark mode support based on system preferences
- 🎨 **Modern UI** - Vibrant design with smooth animations

## Technology Stack

- **Preact** - Lightweight React alternative
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API calls
- **WebSocket** - Real-time updates for fetch progress

## Development

### Prerequisites

- Node.js 16+ and npm
- FioFetch API backend running on `http://localhost:3000`

### Installation

```bash
npm install
```

### Development Server

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is taken).

### Build for Production

Build the static files for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Integration with FastAPI Backend

The built web UI can be served as static files by the FioFetch FastAPI backend.

### Option 1: Using the build directory directly

```bash
# Build the web UI
npm run build

# Start FioFetch backend with static directory pointing to dist
cd ../fio_fetch_py
uv run fiofetch --static-dir ../fio_fetch_webui/dist
```

### Option 2: Copy built files to a dedicated static directory

```bash
# Build the web UI
npm run build

# Copy to the backend's static directory
cp -r dist/* ../fio_fetch_py/static/

# Start FioFetch backend
cd ../fio_fetch_py
uv run fiofetch
```

### Access the Web UI

Once the backend is running with the static files configured, access the UI at:

```
http://localhost:3000/fiofetch.html
```

## Configuration

The web UI connects to the API at `/api/v1/*` endpoints. During development, Vite proxies these requests to `http://localhost:3000`. In production, the UI should be served from the same origin as the API.

### Environment Variables

The backend supports the following environment variables:

- `FIO_FETCH_HOST` - Server host (default: 0.0.0.0)
- `FIO_FETCH_PORT` - Server port (default: 3000)
- `FIO_FETCH_DB_PATH` - Database path (default: ~/.config/fio_fetch/fio.db)
- `FIO_FETCH_TOKEN` - Fio Bank API token
- `FIO_FETCH_STATIC_DIR` - Static files directory (default: static)

You can also configure these via the web UI in the Configuration tab.

## Components

### Dashboard
- Shows transaction statistics (income, expense, net balance)
- Displays recent transactions
- Visual cards with color-coded amounts

### Transaction List
- Paginated list of all transactions from database
- Detailed view modal for each transaction
- Filterable and sortable columns

### Fetch Control
- Manual trigger for fetching new transactions from Fio Bank
- Real-time WebSocket connection for progress updates
- Rate limiting (30-second minimum between fetches)
- Activity log with timestamps

### Configuration
- View current system configuration
- Update Fio Bank API token
- Masked token display for security
- Help documentation

## License

MIT

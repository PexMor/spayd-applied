# Fio Fetch API - Recent Changes

## Overview

The Fio Fetch API now supports serving example data when no token is available and allows configuring a custom API URL for testing against mock servers.

## Changes Made

### 1. Backend (Python API)

#### `fiofetch/fio.py`

- ✅ Already had support for loading example data from `examples/tr.json` when no token is provided
- ✅ WebSocket messages notify users when example data is being used (line 65)
- ✅ Custom API URL support with fallback handling (lines 82-94)
- ✅ Progress messages indicate when connecting to custom API vs production (lines 76-79)

#### `fiofetch/config.py`

- ✅ Already includes `--fio-api-url` configuration option with environment variable support
- ✅ Default value: `https://fioapi.fio.cz/v1/rest`

#### `fiofetch/api.py`

- ✅ Already includes `/config` endpoint that returns current configuration
- ✅ Already supports updating both `fio_token` and `fio_api_url` via POST to `/config`
- ✅ Configuration is saved to `~/.config/fio_fetch/config.yaml`

#### `fiofetch/services.py`

- ✅ Already passes `api_url` to `fetch_and_save_transactions` function

### 2. Frontend (React Web UI)

#### `src/components/ConfigPanel.jsx`

- ✅ UPDATED: Added state management for `newApiUrl` and `showApiUrlInput`
- ✅ UPDATED: Added new handler `handleUpdateApiUrl` for updating API URL
- ✅ UPDATED: Modified `handleUpdateToken` to pass object format to API
- ✅ UPDATED: Added UI section to display and edit Fio API URL
- ✅ UPDATED: Added form for updating API URL with validation
- ✅ UPDATED: Updated help section to mention `FIO_FETCH_API_URL` environment variable
- ✅ UPDATED: Added note about example data when token is not set

#### `src/services/api.js`

- ✅ UPDATED: Changed `updateConfig` function to accept an object instead of just a token string
- ✅ Now supports: `updateConfig({ fio_token: "...", fio_api_url: "..." })`

## Features

### 1. Example Data When No Token Available

When no Fio API token is configured:

- The system automatically loads example transaction data from `examples/tr.json`
- WebSocket messages clearly indicate: `"⚠️ No token provided. Loading example data from tr.json..."`
- Progress messages show: `"📋 Loaded {N} example transactions. Saving..."`
- Completion message shows: `"✅ Done. Saved {N} new example transactions."`

### 2. Configurable API URL

The Fio API base URL can be configured in multiple ways:

#### Via Environment Variable

```bash
export FIO_FETCH_API_URL="http://localhost:8080/api/v1/rest"
fiofetch
```

#### Via Command Line

```bash
fiofetch --fio-api-url http://localhost:8080/api/v1/rest
```

#### Via Configuration File

In `~/.config/fio_fetch/config.yaml`:

```yaml
fio_api_url: http://localhost:8080/api/v1/rest
```

#### Via Web UI

1. Navigate to the Configuration page
2. Click "Update" next to "Fio API URL"
3. Enter your custom API URL (e.g., `http://localhost:8080/api/v1/rest`)
4. Click "Save URL"
5. Restart the server for changes to take effect

### 3. Testing Against Mock Server

To test against your own mock server:

1. **Start your mock server** (e.g., on `http://localhost:8080`)
2. **Configure the API URL** using any of the methods above
3. **Restart the Fio Fetch API** server
4. **Trigger a fetch** via the Web UI or API

The system will:

- Send a WebSocket message: `"Connecting to custom API: http://localhost:8080/api/v1/rest..."`
- Attempt to connect to your mock server
- Handle responses according to the Fio API format

## WebSocket Notifications

The system provides real-time notifications via WebSocket (`/api/v1/ws`) for:

- When example data is being loaded (no token scenario)
- When connecting to custom API URL
- Progress updates during data fetching
- Success/error messages

Example messages:

```json
{"status": "progress", "current": 0, "total": 0, "message": "⚠️ No token provided. Loading example data from tr.json..."}
{"status": "progress", "current": 0, "total": 3, "message": "📋 Loaded 3 example transactions. Saving..."}
{"status": "completed", "new_transactions": 3, "message": "✅ Done. Saved 3 new example transactions."}
```

```json
{
  "status": "progress",
  "current": 0,
  "total": 0,
  "message": "Connecting to custom API: http://localhost:8080..."
}
```

## Usage Examples

### Using Example Data (No Token)

```bash
# Don't set FIO_FETCH_TOKEN
fiofetch
```

Then trigger a fetch via the Web UI or:

```bash
curl -X POST http://localhost:3000/api/v1/fetch
```

### Testing with Mock Server

```bash
# Start your mock server on port 8080
# Then configure and start fiofetch
export FIO_FETCH_API_URL="http://localhost:8080/api/v1/rest"
export FIO_FETCH_TOKEN="your-test-token"
fiofetch
```

## Configuration Priority

The configuration follows this priority order (highest to lowest):

1. Command-line arguments
2. Environment variables
3. Configuration file (`~/.config/fio_fetch/config.yaml`)
4. Default values

## Notes

- Server restart is required after updating configuration via Web UI
- The fiobank library will fall back to default URL if `base_url` parameter is not supported
- Example data is loaded from `examples/tr.json` which contains sample Fio Bank transactions
- All configuration changes via Web UI are persisted to `~/.config/fio_fetch/config.yaml`

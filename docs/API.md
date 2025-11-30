# API Reference

REST API documentation for FioFetch backend.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Currently no authentication required. Designed for local/trusted network use.

**Production Note:** Add authentication layer (OAuth, API keys, or reverse proxy auth) before exposing to internet.

---

## Endpoints

### Configuration

#### GET /api/v1/config

Get current configuration.

**Request:**
```bash
curl http://localhost:3000/api/v1/config
```

**Response:** `200 OK`
```json
{
  "host": "0.0.0.0",
  "port": 3000,
  "fio_token": "ABC...XYZ",
  "fio_api_url": "https://fioapi.fio.cz/v1/rest",
  "db_path": "/root/.config/fio_fetch/fio.db",
  "static_dir": "/app/static",
  "back_date_days": 3
}
```

**Note:** Token is masked in response (first 3 and last 3 characters shown).

---

#### POST /api/v1/config

Update configuration.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/config \
  -H "Content-Type: application/json" \
  -d '{
    "fio_token": "NEW_TOKEN_HERE",
    "back_date_days": 7
  }'
```

**Body Parameters:**
- `fio_token` (string, optional): Fio Bank API token
- `back_date_days` (integer, optional): Default history limit (1-365)
- `fio_api_url` (string, optional): Fio API base URL
- `static_dir` (string, optional): Static files directory

**Response:** `200 OK`
```json
{
  "message": "Configuration updated successfully",
  "config": {
    "fio_token": "NEW...ERE",
    "back_date_days": 7
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "back_date_days must be between 1 and 365"
}
```

---

### Transactions

#### GET /api/v1/transactions

Get transactions from database.

**Request:**
```bash
curl http://localhost:3000/api/v1/transactions?limit=10&offset=0
```

**Query Parameters:**
- `limit` (integer, optional): Number of results (default: 100)
- `offset` (integer, optional): Offset for pagination (default: 0)
- `start_date` (string, optional): Filter from date (YYYY-MM-DD)
- `end_date` (string, optional): Filter to date (YYYY-MM-DD)
- `type` (string, optional): Transaction type (`income` or `expense`)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": 123456789,
      "date": "2025-11-30",
      "amount": 1500.50,
      "currency": "CZK",
      "counterparty": "John Doe",
      "description": "Payment for services",
      "type": "income",
      "variable_symbol": "12345",
      "specific_symbol": null,
      "constant_symbol": null
    },
    // ... more transactions
  ],
  "total": 150,
  "limit": 10,
  "offset": 0
}
```

---

#### POST /api/v1/fetch

Fetch new transactions from Fio Bank API.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-11-01",
    "end_date": "2025-11-30"
  }'
```

**Body Parameters:**
- `start_date` (string, optional): Fetch from date (YYYY-MM-DD)
- `end_date` (string, optional): Fetch to date (YYYY-MM-DD)

**Note:** If dates not provided, fetches since last fetch or using configured `back_date_days`.

**Response:** `200 OK`
```json
{
  "message": "Successfully fetched 25 transactions",
  "count": 25,
  "start_date": "2025-11-01",
  "end_date": "2025-11-30"
}
```

**Error Response:** `503 Service Unavailable`
```json
{
  "detail": "Could not connect to Fio Bank API. Please check your internet connection."
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "detail": "Invalid Fio Bank API token. Please check your configuration."
}
```

**Error Response:** `429 Too Many Requests`
```json
{
  "detail": "Rate limit exceeded. Fio Bank API requires 30 seconds between requests."
}
```

---

#### GET /api/v1/transactions/stats

Get transaction statistics.

**Request:**
```bash
curl http://localhost:3000/api/v1/transactions/stats
```

**Response:** `200 OK`
```json
{
  "total_transactions": 150,
  "total_income": 125000.50,
  "total_expense": 89500.25,
  "balance": 35500.25,
  "currency": "CZK",
  "oldest_transaction": "2025-01-01",
  "newest_transaction": "2025-11-30",
  "last_fetch": "2025-11-30T10:30:00Z"
}
```

---

### History Limit (Zárazka)

#### POST /api/v1/set-last-date

Set history limit to prevent fetching too much data.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -H "Content-Type: application/json" \
  -d '{
    "days_back": 7
  }'
```

**Body Parameters:**
- `days_back` (integer): Number of days back (1-365)

**Response:** `200 OK`
```json
{
  "message": "Successfully set last date to 2025-11-23 (7 days back)",
  "target_date": "2025-11-23",
  "days_back": 7
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "days_back must be between 1 and 365"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "detail": "Fio Bank API token not configured. Please configure your token in the settings."
}
```

**Error Response:** `504 Gateway Timeout`
```json
{
  "detail": "Request to Fio Bank API timed out. Please try again."
}
```

---

### Export

#### GET /api/v1/export/json

Export transactions as JSON.

**Request:**
```bash
curl http://localhost:3000/api/v1/export/json > transactions.json
```

**Query Parameters:**
- `start_date` (string, optional): Filter from date
- `end_date` (string, optional): Filter to date

**Response:** `200 OK`
```json
[
  {
    "id": 123456789,
    "date": "2025-11-30",
    "amount": 1500.50,
    "currency": "CZK",
    "counterparty": "John Doe",
    "description": "Payment for services",
    "type": "income",
    "variable_symbol": "12345"
  }
  // ... more transactions
]
```

---

#### GET /api/v1/export/csv

Export transactions as CSV.

**Request:**
```bash
curl http://localhost:3000/api/v1/export/csv > transactions.csv
```

**Query Parameters:**
- `start_date` (string, optional): Filter from date
- `end_date` (string, optional): Filter to date

**Response:** `200 OK`
```csv
id,date,amount,currency,counterparty,description,type,variable_symbol,specific_symbol,constant_symbol
123456789,2025-11-30,1500.50,CZK,John Doe,Payment for services,income,12345,,
```

---

### Health Check

#### GET /

Health check endpoint.

**Request:**
```bash
curl http://localhost:3000/
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "FioFetch API",
  "version": "2.1.0"
}
```

---

## WebSocket

### Connection

Connect to WebSocket for real-time updates.

**Endpoint:** `ws://localhost:3000/ws`

**Example (JavaScript):**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to FioFetch WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket');
};
```

### Message Types

**Fetch Started:**
```json
{
  "type": "fetch_started",
  "timestamp": "2025-11-30T10:30:00Z"
}
```

**Fetch Progress:**
```json
{
  "type": "fetch_progress",
  "current": 50,
  "total": 100,
  "percentage": 50
}
```

**Fetch Completed:**
```json
{
  "type": "fetch_completed",
  "count": 25,
  "timestamp": "2025-11-30T10:30:30Z"
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Failed to fetch transactions",
  "code": "FETCH_ERROR"
}
```

---

## Error Codes

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (rate limit, zárazka already set) |
| 429 | Too Many Requests (rate limiting) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (API unreachable) |
| 504 | Gateway Timeout (API timeout) |

---

## Rate Limiting

**Fio Bank API Limits:**
- Minimum 30 seconds between requests
- Max 1 request per 30 seconds

**FioFetch Handling:**
- Automatic rate limiting enforced
- Returns 429 if limit exceeded
- Queue system for pending requests

---

## Examples

### Fetch Transactions and Export

```bash
# 1. Set history limit
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -H "Content-Type: application/json" \
  -d '{"days_back": 30}'

# 2. Fetch transactions
curl -X POST http://localhost:3000/api/v1/fetch

# 3. Get transactions
curl http://localhost:3000/api/v1/transactions?limit=100

# 4. Export as JSON
curl http://localhost:3000/api/v1/export/json > transactions.json

# 5. Export as CSV
curl http://localhost:3000/api/v1/export/csv > transactions.csv
```

### Update Configuration

```bash
# Update token and history limit
curl -X POST http://localhost:3000/api/v1/config \
  -H "Content-Type: application/json" \
  -d '{
    "fio_token": "YOUR_NEW_TOKEN",
    "back_date_days": 7
  }'
```

### Get Statistics

```bash
# Get account statistics
curl http://localhost:3000/api/v1/transactions/stats

# Get filtered transactions
curl "http://localhost:3000/api/v1/transactions?start_date=2025-11-01&end_date=2025-11-30&type=income"
```

---

## Interactive API Documentation

**Swagger UI:** http://localhost:3000/docs

**ReDoc:** http://localhost:3000/redoc

Both provide:
- Interactive API explorer
- Try out endpoints
- Request/response examples
- Schema definitions

---

## Client Libraries

### Python

```python
import requests

BASE_URL = "http://localhost:3000/api/v1"

# Get config
response = requests.get(f"{BASE_URL}/config")
config = response.json()

# Fetch transactions
response = requests.post(f"{BASE_URL}/fetch")
result = response.json()

# Get transactions
response = requests.get(f"{BASE_URL}/transactions?limit=50")
transactions = response.json()
```

### JavaScript

```javascript
const BASE_URL = 'http://localhost:3000/api/v1';

// Get config
const config = await fetch(`${BASE_URL}/config`).then(r => r.json());

// Fetch transactions
const result = await fetch(`${BASE_URL}/fetch`, {
  method: 'POST'
}).then(r => r.json());

// Get transactions
const transactions = await fetch(`${BASE_URL}/transactions?limit=50`)
  .then(r => r.json());
```

### cURL

```bash
# Set token
TOKEN="YOUR_FIO_TOKEN"

# Get config
curl http://localhost:3000/api/v1/config

# Set history limit
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'

# Fetch transactions
curl -X POST http://localhost:3000/api/v1/fetch

# Get transactions
curl http://localhost:3000/api/v1/transactions
```

---

## Troubleshooting

### Common Issues

**401 Unauthorized:**
- Verify Fio token is correct
- Check token hasn't expired
- Ensure token is saved in config

**429 Too Many Requests:**
- Wait 30 seconds between fetch requests
- Fio Bank API enforces strict rate limiting

**503 Service Unavailable:**
- Check internet connection
- Verify Fio Bank API is accessible
- Check firewall/proxy settings

**504 Gateway Timeout:**
- Large transaction history may timeout
- Use history limit to reduce data
- Try fetching smaller date ranges

### Debug Mode

Enable debug logging:

```bash
fiofetch --debug
```

View detailed logs:
```bash
# Docker
docker logs -f fiofetch

# Local
# Check terminal output
```

---

## Security Considerations

1. **Token Storage**: Never commit tokens to source control
2. **HTTPS**: Use HTTPS in production
3. **Authentication**: Add auth layer before exposing to internet
4. **Rate Limiting**: Respect Fio Bank API limits
5. **Input Validation**: All inputs validated server-side
6. **Error Messages**: Tokens masked in all responses
7. **CORS**: Configure appropriate CORS policies

---

## Related Documentation

- [User Guide](USER_GUIDE.md) - End-user documentation
- [Development Guide](DEVELOPMENT.md) - Developer setup
- [Docker Guide](../DOCKER.md) - Docker deployment
- [AGENTS.md](../AGENTS.md) - Architecture details


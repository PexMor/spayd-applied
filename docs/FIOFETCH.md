# FioFetch - Transaction Manager Guide

Complete guide for FioFetch, the transaction fetcher and manager for Czech Fio Bank.

## Overview

FioFetch is a self-hosted web application for fetching, storing, and managing transactions from Fio Bank. It provides a modern web interface and REST API for accessing your transaction data.

**Key Features:**

- ✅ Fetch transactions from Fio Bank API
- ✅ Store transactions in local SQLite database
- ✅ Modern web UI with real-time updates
- ✅ REST API for programmatic access
- ✅ History limit (zárazka) to prevent errors
- ✅ Export to JSON/CSV
- ✅ Docker deployment ready
- ✅ Cross-platform (Windows, Linux, macOS)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [Using the Web UI](#using-the-web-ui)
4. [Understanding History Limit](#understanding-history-limit)
5. [API Usage](#api-usage)
6. [Docker Deployment](#docker-deployment)
7. [Data Management](#data-management)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

**Fio Bank API Token:**

1. Log in to Fio Bank internet banking
2. Navigate to Settings → API
3. Generate a read-only token
4. Copy the token (you'll need it for configuration)

**System Requirements:**

- Docker (recommended) OR
- Python 3.13+ and Node.js 16+ (for local development)

### Quick Start (Docker)

**1. Build the image:**

```bash
./d10_build.sh
```

**2. Run the container:**

```bash
FIO_FETCH_TOKEN=your_token ./d20_run.sh
```

**3. Access the app:**
Open http://localhost:3000 in your browser

**4. Configure (if token not set):**

- Click "Configuration" tab
- Enter your Fio Bank API token
- Click "Save"

### Local Development Setup

**Backend:**

```bash
cd fio_fetch_py
uv sync
export FIO_FETCH_TOKEN=your_token
fiofetch
```

**Frontend:**

```bash
cd fio_fetch_webui
yarn install
yarn dev
```

Access backend at http://localhost:3000, frontend at http://localhost:5174

---

## Configuration

### Configuration Methods

FioFetch supports multiple configuration sources (in priority order):

1. **Command-line arguments** (highest priority)
2. **Environment variables**
3. **Configuration file** (`~/.config/fio_fetch/config.yaml`)
4. **Defaults** (lowest priority)

### Configuration Options

| Option        | CLI                | Environment                | Config File      | Default                         |
| ------------- | ------------------ | -------------------------- | ---------------- | ------------------------------- |
| Host          | `--host`           | `FIO_FETCH_HOST`           | `host`           | `0.0.0.0`                       |
| Port          | `--port`           | `FIO_FETCH_PORT`           | `port`           | `3000`                          |
| Token         | `--fio-token`      | `FIO_FETCH_TOKEN`          | `fio-token`      | (none)                          |
| DB Path       | `--db-path`        | `FIO_FETCH_DB_PATH`        | `db-path`        | `~/.config/fio_fetch/fio.db`    |
| Static Dir    | `--static-dir`     | `FIO_FETCH_STATIC_DIR`     | `static-dir`     | `static`                        |
| API URL       | `--fio-api-url`    | `FIO_FETCH_API_URL`        | `fio-api-url`    | `https://fioapi.fio.cz/v1/rest` |
| History Limit | `--back-date-days` | `FIO_FETCH_BACK_DATE_DAYS` | `back-date-days` | `3`                             |

### Example Configurations

**Command Line:**

```bash
fiofetch --host 0.0.0.0 --port 8080 --fio-token YOUR_TOKEN
```

**Environment Variables:**

```bash
export FIO_FETCH_TOKEN=your_token
export FIO_FETCH_PORT=8080
export FIO_FETCH_BACK_DATE_DAYS=7
fiofetch
```

**Configuration File** (`~/.config/fio_fetch/config.yaml`):

```yaml
host: 0.0.0.0
port: 3000
fio-token: YOUR_FIO_BANK_TOKEN
db-path: ~/.config/fio_fetch/fio.db
static-dir: /app/static
fio-api-url: https://fioapi.fio.cz/v1/rest
back-date-days: 7
```

**Docker with Environment Variables:**

```bash
docker run -d \
  -p 3000:3000 \
  -e FIO_FETCH_TOKEN=your_token \
  -e FIO_FETCH_BACK_DATE_DAYS=7 \
  -v ~/.config/fio_fetch:/root/.config/fio_fetch \
  fiofetch:latest
```

---

## Using the Web UI

### Dashboard

**Overview page showing:**

- Account balance (if available)
- Total transactions count
- Recent transactions
- Last fetch timestamp
- Quick actions

### Fetch Control

**Manual Fetch:**

1. Click "Fetch Now" button
2. Wait for API response (may take a few seconds)
3. View status message
4. Check transaction list for new entries

**Set History Limit:**

1. Enter number of days (1-365)
2. Click "Set History Limit"
3. Confirmation shown
4. Future fetches respect this limit

**What is History Limit?**

- Sets a checkpoint date in Fio Bank
- Tells API: "Don't search before this date"
- Prevents timeouts on large histories
- See [Understanding History Limit](#understanding-history-limit) below

### Transaction List

**Features:**

- Paginated table (default: 50 per page)
- Sortable columns (click header)
- Search/filter capabilities
- Export options

**Columns:**

- **Date**: Transaction date
- **Amount**: Transaction amount (income positive, expense negative)
- **Counterparty**: Other party's name
- **Description**: Transaction description
- **VS**: Variable Symbol
- **Type**: Income or Expense

**Actions:**

- Click row to view details
- Sort by any column
- Filter by date range
- Export filtered results

### Configuration Panel

**Settings:**

- **Fio Token**: API token (masked for security)
- **Back Date Days**: Default history limit
- **API URL**: Fio Bank API endpoint (rarely changed)

**Actions:**

- Update settings
- Test connection
- View current configuration
- Save changes

---

## Understanding History Limit

### What is "Zárazka" (History Limit)?

**Zárazka** (Czech for "stopper" or "checkpoint") is a date marker in Fio Bank that limits how far back the API searches for transactions.

**Purpose:**

- Prevents API timeouts on accounts with large history
- Reduces data fetched on each request
- Required for accounts with years of transactions
- Avoids 422 errors from Fio API

### When to Use History Limit

**Use when:**

- ✅ First time setting up FioFetch
- ✅ Account has years of transaction history
- ✅ Getting 422 errors from Fio API
- ✅ Only need recent transactions (not full history)
- ✅ Want faster fetch times

**Don't use when:**

- ❌ Need complete historical data
- ❌ Account is new (< 1 year old)
- ❌ Small number of transactions total

### How to Set History Limit

**Method 1: Web UI**

1. Go to "Fetch Control" tab
2. Enter days in "History Limit" field
3. Click "Set History Limit"
4. Wait for confirmation
5. Click "Fetch Now" to test

**Method 2: API**

```bash
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'
```

**Method 3: Configuration**

```yaml
# config.yaml
back-date-days: 7
```

### Recommended Settings

| Scenario        | Recommended Days | Reason                   |
| --------------- | ---------------- | ------------------------ |
| First setup     | 7-30 days        | Safe starting point      |
| Regular use     | 3-7 days         | Daily/weekly fetching    |
| Monthly check   | 30-60 days       | Monthly reconciliation   |
| Full history    | Don't set        | Fetch all available      |
| Troubleshooting | 1-3 days         | Minimal data for testing |

### Example Workflow

**Initial Setup:**

```bash
# 1. Set history limit to 7 days
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -d '{"days_back": 7}'

# 2. Fetch transactions
curl -X POST http://localhost:3000/api/v1/fetch

# 3. Gradually increase if needed
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -d '{"days_back": 30}'

curl -X POST http://localhost:3000/api/v1/fetch
```

### Technical Details

**What happens behind the scenes:**

1. FioFetch calculates target date (today - days_back)
2. Calls Fio API: `POST /rest/set-last-date/{token}/{date}/`
3. Fio Bank stores this date as checkpoint
4. Future fetches only return transactions after this date
5. Zárazka persists until manually changed

**API Rate Limits:**

- Minimum 30 seconds between any Fio API calls
- Applies to both fetch and set-last-date operations
- FioFetch enforces this automatically

---

## API Usage

### Basic Examples

**Get Configuration:**

```bash
curl http://localhost:3000/api/v1/config
```

**Fetch Transactions:**

```bash
curl -X POST http://localhost:3000/api/v1/fetch
```

**Get Transactions:**

```bash
curl http://localhost:3000/api/v1/transactions?limit=50&offset=0
```

**Set History Limit:**

```bash
curl -X POST http://localhost:3000/api/v1/set-last-date \
  -H "Content-Type: application/json" \
  -d '{"days_back": 7}'
```

**Export JSON:**

```bash
curl http://localhost:3000/api/v1/export/json > transactions.json
```

**Export CSV:**

```bash
curl http://localhost:3000/api/v1/export/csv > transactions.csv
```

### Interactive Documentation

**Swagger UI:**
http://localhost:3000/docs

**ReDoc:**
http://localhost:3000/redoc

See [API.md](API.md) for complete API reference.

---

## Docker Deployment

### Quick Deploy

**Build and run:**

```bash
./d10_build.sh && ./d20_run.sh
```

**With custom settings:**

```bash
FIO_FETCH_PORT=8080 FIO_FETCH_TOKEN=your_token ./d20_run.sh
```

### Container Management

**View logs:**

```bash
./d40_logs.sh
# or
docker logs -f fiofetch
```

**Stop container:**

```bash
./d30_stop.sh
# or
docker stop fiofetch
```

**Restart:**

```bash
docker restart fiofetch
```

**Access shell:**

```bash
docker exec -it fiofetch /bin/bash
```

### Data Persistence

**Volume Mapping:**

- Host: `~/.config/fio_fetch/`
- Container: `/root/.config/fio_fetch/`

**Persisted Files:**

- `config.yaml`: Configuration
- `fio.db`: SQLite database

**Backup:**

```bash
cp -r ~/.config/fio_fetch ~/backups/fio_fetch-$(date +%Y%m%d)
```

**Restore:**

```bash
cp -r ~/backups/fio_fetch-20251130 ~/.config/fio_fetch
docker restart fiofetch
```

### Production Deployment

For production, add:

1. **Reverse proxy** (nginx/traefik) for HTTPS
2. **Authentication** (OAuth, basic auth, or API keys)
3. **Monitoring** (logs, health checks)
4. **Backups** (automated daily backups)
5. **Resource limits** (CPU, memory)

See [DOCKER.md](../DOCKER.md) for complete deployment guide.

---

## Data Management

### Database Schema

**Transactions Table:**

```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    counterparty TEXT,
    description TEXT,
    type TEXT NOT NULL,
    variable_symbol TEXT,
    specific_symbol TEXT,
    constant_symbol TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backup Strategies

**Method 1: File Backup**

```bash
# Backup database file
cp ~/.config/fio_fetch/fio.db ~/backups/fio.db.$(date +%Y%m%d)
```

**Method 2: SQL Dump**

```bash
sqlite3 ~/.config/fio_fetch/fio.db .dump > backup.sql
```

**Method 3: Export API**

```bash
curl http://localhost:3000/api/v1/export/json > transactions-backup.json
```

### Data Import

**From Backup:**

```bash
# Stop FioFetch
docker stop fiofetch

# Restore database
cp ~/backups/fio.db.20251130 ~/.config/fio_fetch/fio.db

# Restart
docker start fiofetch
```

**From SQL Dump:**

```bash
sqlite3 ~/.config/fio_fetch/fio.db < backup.sql
```

### Database Maintenance

**Check database size:**

```bash
ls -lh ~/.config/fio_fetch/fio.db
```

**Vacuum database:**

```bash
sqlite3 ~/.config/fio_fetch/fio.db "VACUUM;"
```

**Count transactions:**

```bash
sqlite3 ~/.config/fio_fetch/fio.db "SELECT COUNT(*) FROM transactions;"
```

---

## Troubleshooting

### Common Issues

**Cannot fetch transactions:**

**Problem:** 401 Unauthorized
**Solution:**

- Verify Fio token is correct
- Regenerate token in Fio Bank
- Update token in configuration

**Problem:** 422 Unprocessable Entity
**Solution:**

- Set history limit to smaller value
- Start with 7 days
- Gradually increase if needed

**Problem:** 429 Too Many Requests
**Solution:**

- Wait 30 seconds between requests
- Check for multiple instances running
- Fio Bank enforces strict rate limits

**Problem:** 503 Service Unavailable
**Solution:**

- Check internet connection
- Verify Fio Bank API is accessible
- Check firewall/proxy settings

**Problem:** 504 Gateway Timeout
**Solution:**

- Use history limit to reduce data
- Try fetching smaller date ranges
- Check for network issues

### Docker-Specific Issues

**Container won't start:**

```bash
# Check logs
docker logs fiofetch

# Common causes:
# - Port already in use
# - Volume permissions
# - Invalid configuration
```

**Port conflict:**

```bash
# Use different port
FIO_FETCH_PORT=8080 ./d20_run.sh
```

**Permission denied:**

```bash
# Fix volume permissions
chmod -R 755 ~/.config/fio_fetch
```

### Database Issues

**Database locked:**

```bash
# Stop all FioFetch instances
docker stop fiofetch
# Wait a moment
docker start fiofetch
```

**Corrupted database:**

```bash
# Restore from backup
cp ~/backups/fio.db.20251130 ~/.config/fio_fetch/fio.db
docker restart fiofetch
```

### API Issues

**Connection refused:**

- Verify FioFetch is running: `docker ps | grep fiofetch`
- Check port mapping: `docker port fiofetch`
- Test endpoint: `curl http://localhost:3000/`

**Slow responses:**

- Check database size
- Run VACUUM on database
- Check system resources

### Debug Mode

Enable detailed logging:

```bash
# Local
fiofetch --debug

# Docker
docker run -d \
  -e LOG_LEVEL=DEBUG \
  -p 3000:3000 \
  -v ~/.config/fio_fetch:/root/.config/fio_fetch \
  fiofetch:latest
```

View logs:

```bash
docker logs -f fiofetch
```

---

## Security Best Practices

1. **Token Security:**

   - Keep token private
   - Use read-only token
   - Rotate regularly
   - Never commit to git

2. **Network Security:**

   - Use HTTPS in production
   - Add authentication layer
   - Limit network access
   - Use firewall rules

3. **Data Security:**

   - Encrypt database backups
   - Secure file permissions
   - Regular backups
   - Audit access logs

4. **Container Security:**
   - Keep image updated
   - Scan for vulnerabilities
   - Use non-root user (future)
   - Limit container capabilities

---

## Advanced Usage

### Automated Fetching

**Using cron:**

```bash
# Add to crontab
0 * * * * curl -X POST http://localhost:3000/api/v1/fetch
```

**Using systemd timer:**

```ini
# /etc/systemd/system/fiofetch.timer
[Unit]
Description=FioFetch Hourly

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

### Custom Scripts

**Python:**

```python
import requests

BASE_URL = "http://localhost:3000/api/v1"

# Fetch transactions
response = requests.post(f"{BASE_URL}/fetch")
print(response.json())

# Get transactions
response = requests.get(f"{BASE_URL}/transactions?limit=100")
transactions = response.json()

for tx in transactions["transactions"]:
    print(f"{tx['date']}: {tx['amount']} {tx['currency']} - {tx['description']}")
```

**Bash:**

```bash
#!/bin/bash
# fetch-and-backup.sh

# Fetch latest transactions
curl -X POST http://localhost:3000/api/v1/fetch

# Wait a moment
sleep 5

# Export to JSON
curl http://localhost:3000/api/v1/export/json > \
  ~/backups/transactions-$(date +%Y%m%d).json

echo "Backup completed"
```

### WebSocket Integration

**JavaScript:**

```javascript
const ws = new WebSocket("ws://localhost:3000/ws");

ws.onopen = () => console.log("Connected");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "fetch_completed") {
    console.log(`Fetched ${data.count} transactions`);
  }
};
```

---

## Related Documentation

- [User Guide](USER_GUIDE.md) - General user documentation
- [API Reference](API.md) - Complete API documentation
- [Docker Guide](../DOCKER.md) - Detailed Docker deployment
- [Development Guide](DEVELOPMENT.md) - Developer setup
- [AGENTS.md](../AGENTS.md) - Architecture details
- [Change History](FIOFETCH_CHANGES.md) - Recent changes and fixes

---

**For additional help, see the documentation or check the GitHub repository.**

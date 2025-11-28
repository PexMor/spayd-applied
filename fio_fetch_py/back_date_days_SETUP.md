# Back Date Days (History Limit) Setup Guide

## What is Back Date Days?

Back Date Days (known as "zarážka" in Czech) is a feature that sets the "last unsuccessful download date" in the Fio Bank API. This prevents the API from going too far back in history when fetching transactions, which helps avoid 422 errors.

## Recent Fixes (Nov 2025)

### Issues Fixed:

1. **Incorrect API URL**: Fixed the URL from `www.fioapi.cz` to `fioapi.fio.cz`
2. **Missing dependency**: Added `requests` library to dependencies
3. **Poor error handling**: Improved error messages for both backend and frontend
4. **Input validation**: Added validation for days_back parameter (1-365)
5. **Security**: Token masking in all error logs to prevent token exposure

## Installation

After updating the code, install the new dependency:

```bash
cd fio_fetch_py
uv sync
# or if using pip:
# pip install -r requirements.txt
```

## Configuration

### Default Setting

The default history limit is **3 days**. You can change this in several ways:

1. **Environment Variable**:

   ```bash
   export FIO_FETCH_BACK_DATE_DAYS=7
   ```

2. **Config File** (`~/.config/fio_fetch/config.yaml`):

   ```yaml
   back-date-days: 7
   ```

3. **Command Line**:

   ```bash
   fiofetch --back-date-days 7
   ```

4. **Web UI**: Go to Configuration → History Limit (Days Back) → Update

## Usage

### Via Web UI

1. Go to the **Fetch Control** page
2. Find the **Set History Limit** section
3. Enter the number of days back (1-365)
4. Click **Set Last Date**

### Via API

```bash
curl -X POST "http://localhost:3000/api/v1/set-last-date" \
  -H "Content-Type: application/json" \
  -d '{"days_back": 3}'
```

## How It Works

When you click "Set Last Date" with 3 days:

1. The system calculates: today - 3 days = target date
2. Calls Fio API: `https://fioapi.fio.cz/v1/rest/set-last-date/{token}/{target_date}/`
3. Fio API now knows not to fetch transactions older than this date
4. This prevents 422 errors caused by too much history

## Error Messages

- **"Fio token not configured"**: Set your token in Configuration
- **"Could not connect to Fio API"**: Check internet connection
- **"Invalid Fio API token"**: Verify your token is correct
- **"Fio API rate limit exceeded"**: Wait 30 seconds between requests
- **"Request timed out"**: Try again later

## Best Practices

- Set the history limit **before** running fetch operations
- Use 3-7 days for regular operations
- Use smaller values if you're getting 422 errors
- Increase the value only if you need older transactions

## Troubleshooting

### Still getting 422 errors?

- Reduce the days_back value (try 1 day)
- Make sure the history limit was set successfully (check for success message)
- Wait 30 seconds between API calls

### Connection errors?

- Verify internet connection
- Check firewall settings
- Ensure `fioapi.fio.cz` is accessible

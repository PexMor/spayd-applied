# Changes Summary - Back Date Days (History Limit) Feature

## Issue Reported

- 500 Internal Server Error when calling `/api/v1/set-last-date`
- DNS resolution error: Could not resolve 'www.fioapi.cz'
- Poor error handling in both backend and frontend

## Root Causes

1. **Incorrect API URL**: Using `www.fioapi.cz` instead of `fioapi.fio.cz`
2. **Flawed URL construction logic**: Complex parsing logic led to wrong domain
3. **Missing dependency**: `requests` library not in pyproject.toml
4. **Poor error handling**: Generic error messages not helpful to users
5. **No input validation**: Frontend allowed invalid values
6. **Security issue**: Token exposed in error logs and messages

## Changes Made

### Backend (Python API) - `fio_fetch_py/`

#### 1. `fiofetch/api.py`

- ✅ Fixed imports: Added `requests`, `datetime`, `timedelta` at module level
- ✅ Fixed URL construction: Hardcoded correct domain `fioapi.fio.cz`
- ✅ Added input validation: days_back must be 1-365
- ✅ Improved error handling:
  - `Timeout` → User-friendly timeout message
  - `ConnectionError` → Clear connection error message
  - `HTTPError` → Specific messages for 401, 403, 409 (rate limit)
- ✅ Better logging: Added info and error logs
- ✅ Clearer error messages mentioning configuration help
- ✅ **Security fix**: Added `mask_token()` function to mask tokens in all error logs and messages

#### 2. `pyproject.toml`

- ✅ Added `requests>=2.31.0` to dependencies

#### 3. Documentation

- ✅ Created `back_date_days_SETUP.md` - Complete setup and usage guide
- ✅ Updated `README.md` - Added back date days section with examples

### Frontend (React/Preact UI) - `fio_fetch_webui/`

#### 1. `src/components/FetchControl.jsx`

- ✅ Added input validation: Check 1-365 range before API call
- ✅ Improved error handling: Parse different error types
- ✅ Better UX: Auto-clear success messages after 5 seconds
- ✅ Specific error messages for different HTTP status codes

## Testing Checklist

After deploying these changes:

- [ ] Install new dependency: `cd fio_fetch_py && uv sync`
- [ ] Restart the backend server
- [ ] Test with valid token:
  - [ ] Set history limit to 3 days (should succeed)
  - [ ] Verify success message appears
  - [ ] Check backend logs for confirmation
- [ ] Test error cases:
  - [ ] Try with invalid days (0, 400) → Should show validation error
  - [ ] Try without token configured → Should show config error
  - [ ] Try with invalid token → Should show token error
- [ ] Test edge cases:
  - [ ] 1 day (minimum)
  - [ ] 365 days (maximum)
  - [ ] Non-numeric input

## API Changes

### New/Modified Endpoints

#### POST `/api/v1/set-last-date`

**Request:**

```json
{
  "days_back": 3 // Optional, defaults to config value
}
```

**Success Response (200):**

```json
{
  "message": "Successfully set last date to 2025-11-25 (3 days back)",
  "target_date": "2025-11-25",
  "days_back": 3
}
```

**Error Responses:**

- `400` - Invalid input or token not configured
- `503` - Connection error
- `504` - Timeout
- `401/403` - Invalid token
- `409` - Rate limit exceeded (Fio API)

#### GET `/api/v1/config`

**Response now includes:**

```json
{
  ...
  "back_date_days": 3
}
```

#### POST `/api/v1/config`

**Request can now include:**

```json
{
  "back_date_days": 7 // Optional
}
```

## Configuration Options

New configuration option:

- CLI: `--back-date-days 3`
- Env: `FIO_FETCH_BACK_DATE_DAYS=3`
- Config file: `back-date-days: 3`
- Web UI: Configuration → History Limit

## Migration Notes

No breaking changes. All existing functionality remains intact.

New functionality is additive:

- Existing deployments will use default value (3 days)
- No database migrations required
- Configuration is optional

## Files Modified

### Backend

- `fio_fetch_py/fiofetch/api.py` - Fixed URL, added error handling
- `fio_fetch_py/fiofetch/config.py` - Added back_date_days config (already done)
- `fio_fetch_py/pyproject.toml` - Added requests dependency
- `fio_fetch_py/README.md` - Added back date days documentation
- `fio_fetch_py/back_date_days_SETUP.md` - New detailed guide (created)

### Frontend

- `fio_fetch_webui/src/services/api.js` - Added setLastDate function (already done)
- `fio_fetch_webui/src/components/FetchControl.jsx` - Improved error handling
- `fio_fetch_webui/src/components/ConfigPanel.jsx` - Added back_date_days config (already done)

## Deployment Steps

1. **Update backend dependencies:**

   ```bash
   cd fio_fetch_py
   uv sync
   ```

2. **Restart backend server:**

   ```bash
   # Stop existing server
   # Start with updated code
   fiofetch
   ```

3. **No frontend rebuild needed** (unless you want to)

   - The changes are in JSX files
   - If using dev server, changes will hot reload
   - If using production build, rebuild and deploy

4. **Verify:**

   ```bash
   # Check API is working
   curl http://localhost:3000/api/v1/config

   # Should show: "back_date_days": 3
   ```

## Known Limitations

- Requires internet connection to reach `fioapi.fio.cz`
- Subject to Fio API rate limits (30 second minimum between calls)
- Only works with valid Fio Bank API token

## Future Enhancements (Optional)

- [ ] Add "Test Connection" button to verify token validity
- [ ] Show last set date in the UI
- [ ] Add option to clear history limit (reset to unlimited history)
- [ ] Add history limit status indicator on dashboard
- [ ] Log history limit changes to database for audit trail

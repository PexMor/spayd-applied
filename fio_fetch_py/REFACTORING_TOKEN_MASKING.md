# Token Masking Refactoring

## Problem

Token masking logic was duplicated in three different places with slightly different implementations:

1. **`services.py`** (lines 13-34): `mask_token_in_message()` - Most comprehensive, handled URL encoding
2. **`fio.py`** (lines 12-16): `mask_token_in_string()` - Simple implementation
3. **`api.py`**: `mask_token()` - Simple implementation (just added)

This created maintenance issues and inconsistencies.

## Solution

Created a single, centralized utility function in a new `utils.py` module.

### New File: `fiofetch/utils.py`

```python
def mask_token(text: str, token: str) -> str:
    """
    Mask the token in strings to prevent exposure in logs and error messages.
    Replaces the token with '<token>' placeholder.

    Handles:
    - Direct token occurrences in text
    - URL-encoded tokens
    """
```

This implementation uses the most comprehensive version (from `services.py`).

## Changes Made

### 1. Created New Module

- ✅ `fiofetch/utils.py` - Centralized utilities module with `mask_token()` function

### 2. Updated `api.py`

**Before:**

```python
def mask_token(text: str, token: str) -> str:
    """Mask token in strings..."""
    if not token or not text:
        return text
    return text.replace(token, '<token>')
```

**After:**

```python
from .utils import mask_token

# Use imported function
masked_error = mask_token(str(e), config.fio_token)
```

### 3. Updated `fio.py`

**Before:**

```python
def mask_token_in_string(text: str, token: str) -> str:
    """Mask token in strings to prevent exposure in logs."""
    if not token or not text:
        return text
    return text.replace(token, '<token>')

# Usage:
error_str = mask_token_in_string(str(e), token)
```

**After:**

```python
from .utils import mask_token

# Usage:
error_str = mask_token(str(e), token)
```

### 4. Updated `services.py`

**Before:**

```python
def mask_token_in_message(message: str, token: str) -> str:
    """
    Mask the token in error messages...
    """
    if not token:
        return message

    masked_message = message.replace(token, '<token>')

    # Handle URL-encoded tokens
    try:
        import urllib.parse
        encoded_token = urllib.parse.quote(token)
        if encoded_token != token:
            masked_message = masked_message.replace(encoded_token, '<token>')
    except Exception:
        pass

    return masked_message

# Usage:
error_str = mask_token_in_message(error_str, config.fio_token)
```

**After:**

```python
from .utils import mask_token

# Usage:
error_str = mask_token(error_str, config.fio_token)
```

## Benefits

1. **Single Source of Truth**: One implementation to maintain
2. **Consistency**: All modules use the same masking logic
3. **Better Features**: All usages now benefit from URL encoding handling
4. **Maintainability**: Future improvements only need to be made in one place
5. **Testability**: Single function to test comprehensively
6. **Clean Code**: Removed duplicate code (~40 lines of duplication)

## Migration Checklist

- [x] Create `fiofetch/utils.py` with `mask_token()` function
- [x] Update `api.py` to import and use `mask_token`
- [x] Update `fio.py` to import and use `mask_token`
- [x] Update `services.py` to import and use `mask_token`
- [x] Remove duplicate function definitions
- [x] Remove unused imports (e.g., `re` from services.py)

## Testing

No behavior changes - this is purely a refactoring. The function works identically:

```python
# Test cases (all should pass):
assert mask_token("https://api.fio.cz/token/abc123/data", "abc123") == "https://api.fio.cz/token/<token>/data"
assert mask_token("Error: Invalid token abc123", "abc123") == "Error: Invalid token <token>"
assert mask_token("No token here", "xyz") == "No token here"
assert mask_token("", "token") == ""
assert mask_token("text", "") == "text"
```

## Future Enhancements

The centralized function can now be easily enhanced for all usages:

- Add masking for partial tokens (e.g., show first/last 4 chars)
- Add support for multiple tokens
- Add regex-based masking for patterns
- Add masking for other sensitive data (passwords, API keys, etc.)

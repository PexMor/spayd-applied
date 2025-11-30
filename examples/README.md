# Batch SPAYD Application - Test Data Files

This directory contains testing example files for the Batch SPAYD Application.

All files are provided in two languages:
- **English files** - prefixed with `en_`
- **Czech files** - prefixed with `cz_`

## Generated Files

### 1. Accounts (Bank Account Configurations)

**English version:** `en_accounts.json`
**Czech version:** `cz_accounts.json`

**Contents:**
- 4 example accounts (CZK, EUR, USD)
- Valid Czech IBANs
- Optional logo URLs
- Account names in respective language

**Usage:** Import in Accounts section of batch application

### 2. Events (Payment Event Configurations)

**English version:** `en_events.json`
**Czech version:** `cz_events.json`

**Contents:**
- 5 different event types
- Single and multiple payment splits (1-3 splits per event)
- Different due dates
- Various VS prefixes, SS, and KS codes
- Email templates in respective language

**Event Examples:**
- Summer Camp / Letní tábor (3 installments)
- Conference Fee / Konferenční poplatek (single payment)
- Membership Dues / Členský příspěvek (with deadline)
- Workshop (3 custom splits with overrides)
- School Trip / Školní zájezd (2 payments)

**Usage:** Import in Events section of batch application

### 3. People Data Files

#### English People Data:
- `en_people_data_with_vs.csv` - 15 English names with VS codes
- `en_people_data_with_vs.xlsx` - Same data in Excel format
- `en_people_data_without_vs.csv` - 20 English names without VS
- `en_people_data_without_vs.xlsx` - Same data in Excel format

#### Czech People Data:
- `cz_people_data_with_vs.csv` - 15 Czech names with VS codes
- `cz_people_data_with_vs.xlsx` - Same data in Excel format
- `cz_people_data_without_vs.csv` - 20 Czech names without VS
- `cz_people_data_without_vs.xlsx` - Same data in Excel format

**Columns (with VS):** FirstName, SecondName, Email, Amount, VS
**Columns (without VS):** FirstName, SecondName, Email, Amount

**Note:** When VS is not provided, the application will auto-generate unique VS codes.

## How to Generate

Run the generation script:

```bash
# Using uv (recommended)
uv run python mk.py

# Or with regular Python (requires openpyxl)
pip install openpyxl
python mk.py
```

## Testing Scenarios

### Scenario 1: English Version - Basic Import with VS
1. Import `en_accounts.json` → Accounts section
2. Import `en_events.json` → Events section  
3. Import `en_people_data_with_vs.csv` → People Data section
4. Select event and generate batch payments

### Scenario 2: Czech Version - Basic Import with VS
1. Import `cz_accounts.json` → Accounts section
2. Import `cz_events.json` → Events section  
3. Import `cz_people_data_with_vs.csv` → People Data section
4. Select event and generate batch payments

### Scenario 3: Auto-Generated VS (English)
1. Import `en_accounts.json` and `en_events.json`
2. Import `en_people_data_without_vs.csv`
3. System will auto-generate VS codes
4. Generate batch payments

### Scenario 4: Auto-Generated VS (Czech)
1. Import `cz_accounts.json` and `cz_events.json`
2. Import `cz_people_data_without_vs.csv`
3. System will auto-generate VS codes
4. Generate batch payments

### Scenario 5: Excel Import
1. Import accounts and events (any language)
2. Import `*_people_data_with_vs.xlsx` or `*_people_data_without_vs.xlsx`
3. Verify Excel parsing works correctly with Czech/English names
4. Generate payments

### Scenario 6: Multiple Splits
1. Select "Summer Camp" or "Workshop" event (any language)
2. Import any people data
3. Generate batch - should create 3 separate payments per person
4. Verify different due dates and amounts

### Scenario 7: Mixed Currencies
1. Import accounts (includes EUR and USD accounts)
2. Create event linked to EUR account
3. Import people data (any language)
4. Generate payments in EUR

### Scenario 8: Mixed Languages
1. Import `en_accounts.json` and `cz_events.json`
2. Import `en_people_data_with_vs.csv`
3. Test cross-language compatibility

## Data Structure Details

### Account Schema
```json
{
  "id": "uuid",
  "name": "string",
  "iban": "CZ...",
  "currency": "CZK|EUR|USD",
  "logoUrl": "string (optional)"
}
```

### Event Schema
```json
{
  "id": "uuid",
  "description": "string",
  "vsPrefix": "string",
  "ss": "string (optional, 1-10 digits)",
  "ks": "string (optional, 4 digits)",
  "splits": [
    {
      "amount": number,
      "dueDate": "YYYY-MM-DD (optional)",
      "vsPrefix": "string (optional override)",
      "ss": "string (optional override)",
      "ks": "string (optional override)"
    }
  ],
  "emailTemplate": "string with variables"
}
```

### People Data Schema (CSV/Excel)
```
FirstName,SecondName,Email,Amount[,VS]
```

**Email Template Variables:**
- `{{FirstName}}` - Person's first name (from CSV column)
- `{{SecondName}}` - Person's second name (from CSV column)
- `{{Email}}` - Person's email address (from CSV column)
- Note: Payment details (amount, VS, IBAN, etc.) are automatically added by the application

## Validation Rules

### IBAN
- Must start with CZ
- Must be valid format

### Variable Symbol (VS)
- Max 10 digits
- Numeric only
- Must be unique per account

### Specific Symbol (SS)
- 1-10 digits
- Numeric only

### Constant Symbol (KS)
- Exactly 4 digits
- Numeric only

### Splits
- Minimum 1 split
- Maximum 3 splits per event
- Each split must have amount > 0

## Common Issues

### Issue: Import fails
- **Solution:** Ensure file encoding is UTF-8
- **Solution:** Check CSV delimiter is comma
- **Solution:** Verify first row contains headers

### Issue: Invalid IBAN error
- **Solution:** Use Czech IBAN format (CZ + 22 digits)
- **Solution:** Generate random IBAN in app if needed

### Issue: VS duplicates
- **Solution:** Ensure VS column has unique values
- **Solution:** Let app auto-generate if omitted

## File Modifications

Feel free to modify these files for your testing needs:

1. **Add more people:** Append rows to CSV/Excel files
2. **Change amounts:** Edit Amount column values
3. **Add custom events:** Modify events.json
4. **Test edge cases:** Add empty fields, special characters, etc.

## Regenerating Files

To regenerate all files with fresh UUIDs and dates:

```bash
uv run python mk.py
```

All files will be overwritten with new data.

---

**Generated:** 2025-11-30 15:15:14
**Script:** mk.py

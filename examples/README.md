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

- `en_people_data_with_vs.csv` - 15 English names with pre-assigned VS
- `en_people_data_with_vs.xlsx` - Same data in Excel format
- `en_people_data_without_vs.csv` - 20 English names for auto-generated VS
- `en_people_data_without_vs.xlsx` - Same data in Excel format

#### Czech People Data:

- `cz_people_data_with_vs.csv` - 15 Czech names with pre-assigned VS
- `cz_people_data_with_vs.xlsx` - Same data in Excel format
- `cz_people_data_without_vs.csv` - 20 Czech names for auto-generated VS
- `cz_people_data_without_vs.xlsx` - Same data in Excel format

**Columns (with VS):** FirstName, SecondName, Email, VS, SS, KS
**Columns (without VS):** FirstName, SecondName, Email, SS, KS

## Identifier Logic & Field Length Constraints

All payment identifiers follow Czech banking standards with strict length limits:

### VS (Variable Symbol) - MAX 10 Digits Total

**Composition:** Event Prefix + Person Suffix

The VS is composed of two parts that must not exceed 10 digits total:

**Event Prefix (configured in Events):**

- **4-6 digits** recommended (leaving room for person suffix)
- Format strategies:
  - **Date-based:** `YYMMDD` (6 digits) - Example: `250701` = July 1, 2025
  - **Code-based:** `YYEE` (4 digits) - Example: `2512` = Year 2025, Event 12
  - **Detailed:** `YYMME` (5 digits) - Example: `25080` = 2025, August, Event 0

**Person Suffix (from people data CSV or auto-generated):**

- **2-4 digits** typically (2 digits for most use cases)
- Pre-assigned in "with_vs" files (e.g., `01`, `02`, `03`)
- Auto-generated from row index in "without_vs" files

**Combined Examples:**
| Event Prefix | Suffix Length | Person | Combined VS | Total Digits |
|--------------|---------------|--------|-------------|--------------|
| 250701 | 2 | 01 | 25070101 | 8 ✅ |
| 2512 | 4 | 0001 | 25120001 | 8 ✅ |
| 25080 | 3 | 001 | 25080001 | 8 ✅ |
| 250801 | 2 | 01 | 25080101 | 8 ✅ |

### SS (Specific Symbol) - 7 Digits

**Structure:** `<grp-id><yy><class-id><class-ord>`

Long-term person identifier that stays constant across all events.

**Components:**

- **grp-id** (1 digit): Group identifier
  - `1` = Students
  - `2` = Others (staff, parents, etc.)
- **yy** (2 digits): Year person entered/joined
  - Example: `23` for 2023, `24` for 2024
- **class-id** (2 digits): Class or group identifier
  - Example: `01` for class 1A, `02` for class 2A
- **class-ord** (2 digits): Position within class/group (01-99)

**Examples:**

- `1230101` = Student(1) + Entered 2023(23) + Class 1(01) + Position 01
- `1230102` = Student(1) + Entered 2023(23) + Class 1(01) + Position 02
- `1240208` = Student(1) + Entered 2024(24) + Class 2(02) + Position 08
- `2230111` = Other(2) + Year 2023(23) + Class 1(01) + Position 11

**Usage:**

- Always present in all people data files
- Used to uniquely identify a person across all events
- Can be prefixed by event SS prefix (optional)

### KS (Constant Symbol) - Exactly 4 Digits

**Usage Options:**

1. **Year storage:** `2025`, `2024`
2. **Payment type codes:**
   - `0308` - Membership fees
   - `0558` - Conference fees
   - `0008` - Membership dues

**Note:** Optional field, can be loaded from people data CSV or set by event configuration.

### VS Prefix Strategies in Events

Different events use different VS prefix strategies depending on their needs:

**1. Date-Based (6 digits):** Best for time-specific events

```json
{
  "vsPrefix": "250701", // July 1, 2025
  "vsSuffixLength": 2 // Allows 01-99 people (8 digits total)
}
```

**2. Event Code (4 digits):** Compact for small events

```json
{
  "vsPrefix": "2512", // Year 2025, Event 12
  "vsSuffixLength": 4 // Allows 0001-9999 people (8 digits total)
}
```

**3. Detailed Code (5 digits):** Balance between info and space

```json
{
  "vsPrefix": "25080", // 2025, August, Event 0
  "vsSuffixLength": 3 // Allows 001-999 people (8 digits total)
}
```

**4. Split-Specific Overrides:** Different VS for each installment

```json
{
  "vsPrefix": "25080",
  "splits": [
    { "vsPrefix": "250801" }, // Split 1: August 1
    { "vsPrefix": "250802" }, // Split 2: August 2
    { "vsPrefix": "250803" } // Split 3: August 3
  ]
}
```

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

**With VS (pre-assigned):**

```
FirstName,SecondName,Email,VS,SS,KS
```

**Without VS (auto-generated):**

```
FirstName,SecondName,Email,SS,KS
```

**Column Descriptions:**

- `FirstName` - Person's first name (required)
- `SecondName` - Person's last/second name (required)
- `Email` - Person's email address (required)
- `VS` - Variable Symbol suffix: 2-4 digits (optional, will be auto-generated if missing)
  - Combined with event prefix to create full VS (max 10 digits total)
  - Example: `01` in CSV + event prefix `250701` = `25070101`
- `SS` - Specific Symbol: 7-digit person identifier (required)
  - Structure: `<grp-id><yy><class-id><class-ord>`
  - Example: `1230101` = Student, entered 2023, class 1, position 01
- `KS` - Constant Symbol: Exactly 4 digits (optional)
  - Can be year (`2025`) or payment type code (`0308`)

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

- **Max 10 digits total** (event prefix + person suffix)
- Numeric only
- Must be unique per account
- Recommended: 8 digits (6-digit prefix + 2-digit suffix)
- Person suffix in CSV: 2-4 digits
- Event prefix in Event config: 4-6 digits

### Specific Symbol (SS)

- **Exactly 7 digits** (structured format)
- Numeric only
- Structure: `<grp-id><yy><class-id><class-ord>`
- Example: `1230101` = 1(student) + 23(year) + 01(class) + 01(position)

### Constant Symbol (KS)

- **Exactly 4 digits**
- Numeric only
- Can be year (e.g., `2025`) or payment type code (e.g., `0308`)

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

### Issue: VS exceeds 10 digits

- **Solution:** Use shorter event prefix (4-6 digits recommended)
- **Solution:** Use shorter person suffix (2 digits recommended)
- **Example:** `250701` (6) + `01` (2) = `25070101` (8 digits) ✅

### Issue: SS format incorrect

- **Solution:** Use 7-digit format: `<grp><yy><class><ord>`
- **Example:** `1230101` not `12345678901`

## File Modifications

Feel free to modify these files for your testing needs:

1. **Add more people:** Append rows to CSV/Excel files

   - Ensure VS suffix is 2-4 digits
   - Ensure SS is exactly 7 digits in format `<grp><yy><class><ord>`
   - Ensure KS is exactly 4 digits (or empty)

2. **Add custom events:** Modify events.json

   - Keep VS prefix to 4-6 digits for optimal space
   - Set appropriate VS suffix length (2-4 digits)
   - Total VS must not exceed 10 digits

3. **Test different VS strategies:**

   - Date-based: `vsPrefix: "250701"` (6 digits)
   - Code-based: `vsPrefix: "2512"` (4 digits)
   - Detailed: `vsPrefix: "25080"` (5 digits)

4. **Test edge cases:**
   - Maximum VS length: 10 digits total
   - SS structure variations: Different groups, years, classes
   - KS variations: Years vs. payment codes

## Regenerating Files

To regenerate all files with fresh UUIDs and dates:

```bash
uv run python mk.py
```

All files will be overwritten with new data.

## Real-World Examples from Generated Files

### Example 1: Summer Camp with Date-Based VS

```json
{
  "description": "Letní tábor 2025",
  "vsPrefix": "250701", // July 1, 2025 (6 digits)
  "vsSuffixLength": 2 // Person 01-99 (2 digits)
}
```

**Result:** VS = `25070101` (8 digits) for person 01

### Example 2: Conference with Event Code VS

```json
{
  "description": "Conference Registration",
  "vsPrefix": "2512", // Year 25, Event 12 (4 digits)
  "vsSuffixLength": 4 // Person 0001-9999 (4 digits)
}
```

**Result:** VS = `25120001` (8 digits) for person 0001

### Example 3: Workshop with Split Overrides

```json
{
  "description": "Workshop - 3 Installments",
  "vsPrefix": "25080",
  "splits": [
    { "vsPrefix": "250801" }, // August 1
    { "vsPrefix": "250802" }, // August 2
    { "vsPrefix": "250803" } // August 3
  ]
}
```

**Result:**

- Split 1: VS = `25080101` for person 01
- Split 2: VS = `25080201` for person 01
- Split 3: VS = `25080301` for person 01

### Example Person Data

```csv
FirstName,SecondName,Email,VS,SS,KS
Jan,Novák,jan.novak@example.com,01,1230101,2025
Eva,Svobodová,eva.svobodova@email.cz,02,1230102,2025
```

**Person 1 (Jan Novák):**

- VS suffix: `01`
- SS: `1230101` = Student(1) + 2023(23) + Class 1(01) + Position 01
- KS: `2025` = Year

**Person 2 (Eva Svobodová):**

- VS suffix: `02`
- SS: `1230102` = Student(1) + 2023(23) + Class 1(01) + Position 02
- KS: `2025` = Year

---

**Generated:** 2025-11-30 18:43:04
**Script:** mk.py

## Technical Implementation Notes

### VS Composition Logic

The application combines VS prefix (from event) with VS suffix (from people data or row index):

```
Full VS = Event.vsPrefix + padLeft(Person.VS || rowIndex, Event.vsSuffixLength, '0')
```

### SS Structure Encoding

The 7-digit SS encodes multiple pieces of information:

```
SS = <grp:1><year:2><class:2><order:2>
Example: 1230101
  1 = Student group
  23 = Entered 2023
  01 = Class 1
  01 = First person in class
```

### Maximum Field Lengths (Czech Banking Standard)

- **VS:** 10 digits maximum
- **SS:** 10 digits maximum (we use 7 for structured data)
- **KS:** Exactly 4 digits

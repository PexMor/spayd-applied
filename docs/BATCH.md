# Batch Payment Processor Guide

Complete guide for using the Batch Payment Processor to generate multiple payment requests with email notifications.

## Overview

The Batch Payment Processor is designed for scenarios where you need to send payment requests to multiple people, such as:
- Event organizers collecting fees from attendees
- Clubs or associations collecting membership dues
- Small businesses invoicing multiple clients
- Group trip coordinators splitting expenses
- Educational institutions collecting course fees

**Access:** https://pexmor.github.io/spayd-applied/app/batch.html

---

## Key Features

- ✅ Import people data from Excel or CSV files
- ✅ Manual data entry interface
- ✅ Generate individual QR codes for each person
- ✅ Create personalized email templates
- ✅ Batch export (HTML emails + QR images)
- ✅ Variable Symbol auto-generation
- ✅ Separate storage from main SPAYD app
- ✅ Offline-first architecture

---

## Quick Start

### 1. Setup Accounts

Before processing payments, configure your bank accounts:

1. Click hamburger menu (☰)
2. Select "Accounts"
3. Click "Add Account"
4. Enter:
   - **Name**: Descriptive name (e.g., "Event Account")
   - **IBAN**: Your bank account (CZ format)
   - **Currency**: CZK, EUR, etc.
5. Click "Save"

### 2. Create Events

Define the payment event:

1. Go to "Events" in menu
2. Click "Add Event"
3. Enter:
   - **Name**: Event description (e.g., "Summer Camp 2025")
   - **Account**: Select account
   - **Default Amount**: Default payment amount
4. Click "Save"

### 3. Import People Data

**Option A: Excel/CSV Import**

1. Prepare your file with columns:
   - Name
   - Email
   - Amount (optional if event has default)
   - Variable Symbol (optional, auto-generated if empty)

2. In the app:
   - Click "Import Data"
   - Select your file
   - Map columns to fields
   - Preview and confirm

**Option B: Manual Entry**

1. Click "Add Person"
2. Fill in form:
   - Name
   - Email
   - Amount
   - Variable Symbol (optional)
3. Click "Save"

### 4. Generate Batch Payments

1. Select event from dropdown
2. Click "Generate All Payments"
3. System creates:
   - Individual QR codes
   - Personalized emails
   - Payment tracking data

### 5. Preview & Export

1. Review generated emails
2. Click "Preview" for individual emails
3. Click "Export Batch" to download:
   - HTML email files
   - QR code images
   - ZIP archive with all files

### 6. Send Emails

Use the exported HTML files with your email client or service:
- Mail merge in Outlook/Gmail
- Email marketing platform (Mailchimp, SendGrid, etc.)
- Custom scripts

---

## Data Import Guide

### Excel Format

**Required Columns:**
- `Name` or `Jméno`: Full name
- `Email` or `E-mail`: Valid email address

**Optional Columns:**
- `Amount` or `Částka`: Payment amount
- `VS` or `Variable Symbol` or `Variabilní symbol`: Unique identifier

**Example:**

| Name | Email | Amount | VS |
|------|-------|--------|-----|
| Jan Novák | jan.novak@example.com | 1500 | 20251001 |
| Eva Svobodová | eva.svobodova@example.com | 1500 | 20251002 |
| Petr Dvořák | petr.dvorak@example.com | 1200 | 20251003 |

**Tips:**
- First row must be headers
- Amount should be numeric (no currency symbols)
- VS should be numeric and unique
- Email must be valid format

### CSV Format

Same structure as Excel, but comma-separated:

```csv
Name,Email,Amount,VS
Jan Novák,jan.novak@example.com,1500,20251001
Eva Svobodová,eva.svobodova@example.com,1500,20251002
Petr Dvořák,petr.dvorak@example.com,1200,20251003
```

**Encoding:** UTF-8 (for Czech characters)

### Variable Symbol Generation

If Variable Symbol not provided, system auto-generates:

**Method 1: Sequential**
- Format: `YYYYMMDD` + sequential number
- Example: `202511301`, `202511302`, `202511303`

**Method 2: Hash-based**
- Based on name and timestamp
- Ensures uniqueness
- Example: `156789012`

**Best Practice:**
- Use your own VS for tracking
- Ensure uniqueness across all payments
- Use meaningful patterns (e.g., date + person ID)

---

## Email Templates

### Default Template

The system provides a default email template:

**Subject:** Payment Request - [Event Name]

**Body:**
```
Hello [Name],

Please make a payment for [Event Name].

Amount: [Amount] CZK
Variable Symbol: [VS]
Account: [IBAN]

You can scan the QR code below with your banking app:

[QR Code Image]

Thank you!
```

### Customization

Customize email content:

1. Go to "Email Settings"
2. Edit template text
3. Use variables:
   - `{name}`: Person's name
   - `{amount}`: Payment amount
   - `{vs}`: Variable Symbol
   - `{iban}`: Account IBAN
   - `{event}`: Event name
   - `{message}`: Custom message

**Example Custom Template:**

```
Vážený {name},

posíláme Vám platební údaje pro {event}.

Částka k úhradě: {amount} {currency}
Variabilní symbol: {vs}

Platbu můžete provést naskenováním QR kódu:

[QR Code]

Děkujeme za Vaši účast!

S pozdravem,
Organizační tým
```

### Email Formats

System generates two versions:

1. **HTML Version**
   - Rich formatting
   - Embedded QR code (Base64)
   - Modern design
   - Email client compatible

2. **Text Version**
   - Plain text fallback
   - All payment details
   - No images (IBAN link instead)

---

## Export Options

### ZIP Archive Export

**Contents:**
```
batch-export.zip
├── emails/
│   ├── jan-novak.html
│   ├── eva-svobodova.html
│   └── petr-dvorak.html
├── qr-codes/
│   ├── jan-novak.png
│   ├── eva-svobodova.png
│   └── petr-dvorak.png
├── data/
│   ├── people.json
│   └── summary.txt
└── index.html (batch summary)
```

### Individual File Export

Download files one by one:
- Click person's row
- Click "Download Email" or "Download QR"

### Data Export

Export people list for backup:
- JSON format
- CSV format
- Excel format (planned)

---

## Use Cases & Examples

### Example 1: School Trip

**Scenario:** Collecting €50 from 30 students

**Steps:**
1. Create account "School Trip Fund"
2. Create event "Vienna Trip 2025" with €50 default
3. Import student list (name, email, parent email)
4. Generate batch payments
5. Export and send to parents

**Tip:** Use student ID as Variable Symbol for tracking

### Example 2: Club Membership

**Scenario:** Annual membership dues (varying amounts)

**Steps:**
1. Create account "Club Account"
2. Create event "Annual Membership 2025"
3. Manual entry or import with different amounts per member type
4. Generate payments
5. Send personalized emails

**Tip:** Use membership ID as VS

### Example 3: Wedding Contribution

**Scenario:** Collecting contributions from guests

**Steps:**
1. Create account "Wedding Gift Fund"
2. Create event "Our Wedding" (no default amount)
3. Import guest list with suggested amounts
4. Generate QR codes
5. Include in wedding invitations

**Tip:** Make payment optional, use guest ID as VS

### Example 4: Retreat Registration

**Scenario:** Corporate retreat with different room types

**Steps:**
1. Create event "Company Retreat 2025"
2. Import employee list with room-based pricing
3. Generate payments
4. Send via company email system

**Excel Structure:**
```
| Employee | Email | Room Type | Amount | VS |
|----------|-------|-----------|--------|-----|
| John | j@company.com | Single | 2500 | EMP001 |
| Jane | jane@company.com | Double | 2000 | EMP002 |
```

---

## Advanced Features

### Bulk Operations

**Select Multiple:**
- Checkbox selection for multiple people
- Bulk actions: Delete, Export, Regenerate

**Filter & Search:**
- Search by name, email, VS
- Filter by amount range
- Sort by any column

### Payment Tracking

**Status Tracking:**
- Pending
- Sent (email sent)
- Paid (manual marking)
- Cancelled

**Mark as Paid:**
1. Select person
2. Click "Mark as Paid"
3. Enter payment date (optional)

**Export Paid List:**
- Filter by "Paid" status
- Export for accounting

### Custom Variables

Add custom fields for personalization:

1. Go to "Custom Fields"
2. Add field (e.g., "Seat Number", "Group")
3. Import or enter data
4. Use in email template: `{custom_seat_number}`

---

## Best Practices

### Data Management

1. **Backup Regularly**: Export people data periodically
2. **Unique VS**: Always ensure unique Variable Symbols
3. **Validate Data**: Review imported data before generating
4. **Test First**: Send test email to yourself before batch
5. **Keep Records**: Export summary for accounting

### Email Delivery

1. **Use Reputable Service**: Gmail, Outlook, Mailchimp
2. **Avoid Spam**: Don't send too many at once
3. **Personalize Subject**: Include recipient name
4. **Plain Text Too**: Always include text version
5. **Test Rendering**: Preview in different email clients

### Payment Collection

1. **Clear Instructions**: Make payment process obvious
2. **Deadline**: Include payment due date
3. **Contact Info**: Provide support email/phone
4. **Follow Up**: Send reminders for unpaid
5. **Confirmation**: Send receipt after payment

### Security & Privacy

1. **Data Protection**: Don't share exported files publicly
2. **Email Security**: Use encrypted email if possible
3. **Access Control**: Limit who can access batch data
4. **Delete Old Data**: Clear processed batches regularly
5. **GDPR Compliance**: Obtain consent for data processing

---

## Troubleshooting

### Import Issues

**"Invalid file format"**
- Ensure file is .xlsx or .csv
- Check for corrupt file
- Try re-saving in Excel

**"Missing required columns"**
- Verify Name and Email columns exist
- Check column header spelling
- Ensure headers in first row

**"Invalid email addresses"**
- Review email format (must have @ and domain)
- Remove spaces around emails
- Check for special characters

### Generation Issues

**QR codes not generating:**
- Verify IBAN is valid
- Check amount is positive number
- Ensure VS is numeric

**Emails look broken:**
- Check for special characters in template
- Verify all variables are closed with }
- Test in different browsers

**Export fails:**
- Clear browser cache
- Check available disk space
- Try smaller batch size

### Browser Issues

**Data not saving:**
- Enable browser storage
- Check private browsing mode (doesn't persist)
- Clear old batch data

**Performance slow:**
- Limit batch size to <100 at once
- Clear completed batches
- Use modern browser (Chrome, Firefox)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Add new person |
| `Ctrl + I` | Import data |
| `Ctrl + G` | Generate batch |
| `Ctrl + E` | Export batch |
| `Ctrl + S` | Save changes |
| `Esc` | Close dialog |
| `Ctrl + F` | Search/filter |

---

## Limits & Constraints

**Technical Limits:**
- Max people per batch: 500 (recommended <100)
- Max file size: 5MB
- Supported formats: XLSX, CSV
- IBAN: CZ format validated
- Variable Symbol: Max 10 digits

**Browser Storage:**
- Uses IndexedDB
- No server storage
- Data stays on device
- Export for backup

---

## FAQs

**Q: Can I use for non-CZ bank accounts?**
A: Yes, but IBAN validation is CZ-focused. Other formats may work but not guaranteed.

**Q: Is email sending automatic?**
A: No, system generates email files. You send via your email service.

**Q: Can I edit generated emails?**
A: Yes, exported HTML files can be edited before sending.

**Q: What happens if VS duplicates?**
A: System warns you. Ensure uniqueness before generating.

**Q: Can I process multiple events simultaneously?**
A: Yes, each event processed independently. Select event for each batch.

**Q: Is data synced across devices?**
A: No, all data local to browser. Export for transfer.

**Q: Can I undo batch generation?**
A: Yes, batch data can be deleted. Already sent emails cannot be recalled.

**Q: Maximum email size?**
A: ~100KB per email (HTML + embedded QR). Well within limits.

---

## Related Documentation

- [User Guide](USER_GUIDE.md) - Main app documentation
- [Development Guide](DEVELOPMENT.md) - Developer setup
- [AGENTS.md](../AGENTS.md) - Architecture details

---

**Questions or issues? Check the [User Guide](USER_GUIDE.md) or [AGENTS.md](../AGENTS.md) for more details.**


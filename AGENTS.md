# AGENTS.md - Architecture & Design Guide

This document provides architectural context, design decisions, and technical details for both human developers and AI agents working with the SPAYD Applied codebase.

## Project Overview

**SPAYD Applied** is a monorepo containing three interconnected applications for Czech banking operations:

1. **SPAYD QR Generator** - Single payment QR code generation (main application)
2. **Batch Payment Processor** - Bulk payment processing with email generation
3. **FioFetch** - Transaction fetcher and manager for Fio Bank API

## Repository Structure

```
spayd-applied/
├── src/                    # Main SPAYD QR Generator app
│   ├── components/         # Preact components
│   ├── i18n/              # Internationalization (CS/EN)
│   ├── services/          # Business logic
│   ├── batch/             # Batch payment processor
│   └── db.ts              # IndexedDB wrapper
├── fio_fetch_py/          # Python backend for FioFetch
│   └── fiofetch/          # FastAPI application
├── fio_fetch_webui/       # Preact UI for FioFetch
│   └── src/               # React-like components
├── docs/                  # Comprehensive documentation
├── dist/                  # Production builds
├── Dockerfile             # Multi-stage Docker build
└── docker-compose.yml     # Docker orchestration
```

## Architecture

### 1. SPAYD QR Generator (Main App)

**Technology Stack:**
- **Framework:** Preact 10.16 (3KB React alternative)
- **Build Tool:** Vite 4.4 (fast ES module bundler)
- **Language:** TypeScript 5.0
- **Styling:** TailwindCSS 3.4 + custom CSS
- **Storage:** IndexedDB (via custom wrapper in `db.ts`)
- **QR Generation:** `qrcode` library + `spayd` library for SPAYD format

**Key Design Decisions:**

1. **Offline-First Architecture**
   - All data stored in IndexedDB for offline capability
   - No backend required for core functionality
   - Optional sync to external webhook for backup/integration

2. **Storage Schema (IndexedDB stores):**
   ```typescript
   - accounts: { id, name, iban, currency }
   - events: { id, name, accountId, defaultAmount }
   - history: { id, timestamp, account, amount, vs, message, qrData }
   - syncQueue: { id, data, status, retries }
   - config: { webhookUrl, language, ... }
   ```

3. **Component Architecture:**
   - `PaymentForm.tsx` - Main QR generation form
   - `AccountManager.tsx` - CRUD for bank accounts
   - `EventManager.tsx` - CRUD for payment events
   - `PaymentHistory.tsx` - Transaction log viewer
   - `SyncQueue.tsx` - Webhook sync status monitor
   - `ConfigWizard.tsx` - Global settings management

4. **SPAYD Format:**
   - Follows Czech QR payment standard (Short Payment Descriptor)
   - Compatible with all Czech banking apps
   - Format: `SPD*1.0*ACC:CZ123...*AM:100.50*CC:CZK*MSG:Payment*X-VS:12345`

5. **Internationalization:**
   - Two languages: Czech (cs) and English (en)
   - Translation files in `src/i18n/`
   - Context-based language switching

### 2. Batch Payment Processor

**Location:** `src/batch/`

**Purpose:** Generate multiple payment requests with email notifications for events (e.g., sending invoices to multiple people).

**Technology Stack:**
- Same as main app (Preact, TypeScript, TailwindCSS)
- Additional: `xlsx` for Excel import, `file-saver` for downloads, `jszip` for batch export

**Key Components:**
- `BatchApp.tsx` - Main application shell
- `PeopleDataManager.tsx` - Import/manage recipient data (Excel/CSV)
- `BatchAccountManager.tsx` - Account management (separate from main app)
- `BatchEventManager.tsx` - Event definitions
- `EmailPreview.tsx` - Preview generated emails
- `ManualPaymentEntry.tsx` - Manual data entry
- `email-generator.tsx` - Email template engine
- `PaymentEmail.tsx` - Email template component

**Storage:**
- Uses separate IndexedDB database: `batch-db`
- Stores: `batch-accounts`, `batch-events`, `batch-people`

**Workflow:**
1. Import people data (Excel/CSV with name, email, amount, VS)
2. Select event and account
3. Generate payment QRs for each person
4. Generate email templates (HTML + text)
5. Export as batch download (HTML files + QR images)

**IBAN Generation:**
- `iban-generator.ts` - Auto-generates Variable Symbols (VS) from person data
- Ensures unique identifiers for payment tracking

### 3. FioFetch - Transaction Fetcher

**Backend:** `fio_fetch_py/`

**Technology Stack:**
- **Framework:** FastAPI (async Python web framework)
- **Language:** Python 3.13
- **Database:** SQLite (via custom ORM in `database.py`)
- **Package Manager:** `uv` (fast Python package installer)
- **API:** Fio Bank REST API (`fioapi.fio.cz`)

**Architecture:**
- `api.py` - REST API endpoints (`/api/v1/*`)
- `fio.py` - Fio Bank API client
- `database.py` - SQLite wrapper and models
- `config.py` - Configuration management (YAML/env/CLI)
- `services.py` - Business logic layer
- `main.py` - FastAPI application entry point

**Key Endpoints:**
- `GET /api/v1/transactions` - Fetch transactions
- `POST /api/v1/fetch` - Trigger fetch from Fio API
- `GET /api/v1/config` - Get configuration
- `POST /api/v1/config` - Update configuration
- `POST /api/v1/set-last-date` - Set history limit (zárazka)
- `WS /ws` - WebSocket for real-time updates

**Frontend:** `fio_fetch_webui/`

**Technology Stack:**
- **Framework:** Preact (same as main app)
- **State:** Zustand (lightweight state management)
- **Build:** Vite + Yarn 4

**Components:**
- `Dashboard.jsx` - Main overview
- `TransactionList.jsx` - Transaction table
- `FetchControl.jsx` - Fetch controls and history limit
- `ConfigPanel.jsx` - Settings management

**Configuration Hierarchy:**
1. Command-line arguments (highest priority)
2. Environment variables
3. Config file (`~/.config/fio_fetch/config.yaml`)
4. Defaults (lowest priority)

**Docker Deployment:**
- Multi-stage build (Node.js for frontend, Python for backend)
- Final image: ~255MB (optimized)
- Volume mapping: `~/.config/fio_fetch` for persistence
- Health checks and auto-restart

## Design Patterns & Principles

### 1. Component Composition
All three apps follow similar patterns:
- Functional components (no classes)
- Hooks for state management (`useState`, `useEffect`)
- Props for data flow (one-way data binding)
- Context for global state (language, config)

### 2. Data Flow
```
User Input → Component → Service Layer → Storage (IndexedDB/SQLite)
                ↓
         Update UI (reactive)
```

### 3. Error Handling
- Try-catch blocks in async operations
- User-friendly error messages
- Error logging (console for debugging)
- Network error recovery (retry mechanisms)

### 4. Security Considerations
- API tokens stored in config files (not in code)
- Token masking in logs (see `mask_token()` in `api.py`)
- No sensitive data in localStorage (IndexedDB preferred)
- CORS headers for API access
- Input validation on all user inputs

### 5. Performance Optimizations
- Code splitting (separate entry points for main/batch apps)
- Tree shaking (Vite removes unused code)
- Lazy loading of heavy components
- IndexedDB for large datasets (not localStorage)
- Caching of frequently accessed data

## Integration Points

### 1. Webhook Sync (Optional)
The main app can sync generated payments to an external webhook:
- Configurable URL in settings
- JSON payload with payment details
- Retry mechanism with exponential backoff
- Queue status monitoring

### 2. Fio Bank API Integration
FioFetch integrates with Fio Bank's REST API:
- API docs: https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf
- Rate limit: 30 seconds between requests
- Token-based authentication
- Supports multiple endpoints (transactions, set-last-date)

### 3. Export Formats
- **QR Codes:** PNG images (base64 encoded)
- **Payment Data:** JSON export
- **Batch Emails:** HTML files + attachments
- **Transaction Data:** JSON/CSV export

## Development Workflow

### Local Development

**Main App:**
```bash
yarn install
yarn dev          # http://localhost:5173
```

**Batch App:**
```bash
yarn dev          # Access /batch.html
```

**FioFetch:**
```bash
# Backend
cd fio_fetch_py
uv sync
uv run fiofetch

# Frontend
cd fio_fetch_webui
yarn install
yarn dev
```

### Production Build

**Main App:**
```bash
yarn build        # Output: dist/
```

**FioFetch (Docker):**
```bash
./d10_build.sh    # Multi-stage build
./d20_run.sh      # Run container
```

### Deployment

**GitHub Pages:**
- Main app deployed to `https://pexmor.github.io/spayd-applied/`
- Build script: `yarn build && cp -r dist/* docs/app/`
- Deployment: Push to `main` branch, GitHub Actions handles the rest

**Docker:**
- FioFetch deployed as single container
- Includes both frontend and backend
- Persistent storage via volume mapping

## Testing Strategy

### Unit Tests
- Python backend: `pytest` (see `fio_fetch_py/tests/`)
- Test files: `test_*.py`
- Coverage: API endpoints, database operations, Fio API client

### Integration Tests
- Mock Fio API responses (see `tests/test_mock.py`)
- Test full request/response cycles
- Async operation testing

### Manual Testing
- Browser testing (Chrome, Firefox, Safari)
- Mobile testing (iOS, Android banking apps)
- QR code scanning verification
- Docker deployment testing

## Common Development Tasks

### Adding a New Feature

1. **Main App:**
   - Create component in `src/components/`
   - Add route/navigation in `app.tsx`
   - Update IndexedDB schema if needed (in `db.ts`)
   - Add translations in `src/i18n/`

2. **FioFetch Backend:**
   - Add endpoint in `api.py`
   - Update models in `models.py` if needed
   - Add service layer in `services.py`
   - Update API docs (automatic with FastAPI)

3. **FioFetch Frontend:**
   - Add component in `src/components/`
   - Update state in `useAppStore.js`
   - Add API call in `services/api.js`

### Debugging

**Browser DevTools:**
- IndexedDB inspector (Application tab)
- Console for logs and errors
- Network tab for API calls

**Python Debugging:**
```bash
# Enable debug mode
fiofetch --debug

# View logs
./d40_logs.sh
```

**Docker Debugging:**
```bash
# Access container shell
docker exec -it fiofetch /bin/bash

# Check logs
docker logs -f fiofetch

# Inspect container
docker inspect fiofetch
```

## Technical Constraints & Limitations

1. **SPAYD Format:** Only supports Czech banking standard (not SEPA QR codes)
2. **Fio Bank API:** Rate limited to 1 request per 30 seconds
3. **IndexedDB:** Browser-specific storage (not portable)
4. **Offline Sync:** Requires manual trigger or periodic checks
5. **Docker:** Single container design (not microservices)

## Future Enhancement Opportunities

1. **Add SEPA QR code support** (EPC QR standard)
2. **Backend for main app** (optional sync server)
3. **Multi-bank support in FioFetch** (beyond Fio Bank)
4. **Mobile apps** (React Native or PWA)
5. **Automated testing** (E2E tests with Playwright/Cypress)
6. **CI/CD pipeline** (automated builds and deployments)

## Key Libraries & Dependencies

### Frontend (All Apps)
- `preact` - 3KB React alternative
- `qrcode` - QR code generation
- `spayd` - SPAYD format encoding
- `ibantools` - IBAN validation
- `xlsx` - Excel file parsing
- `file-saver` - File download helper
- `jszip` - ZIP file generation

### Backend (FioFetch)
- `fastapi` - Modern async web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `requests` - HTTP client for Fio API
- `aiosqlite` - Async SQLite driver
- `python-dotenv` - Environment variable management

### Build Tools
- `vite` - Fast build tool and dev server
- `typescript` - Type-safe JavaScript
- `tailwindcss` - Utility-first CSS framework
- `postcss` - CSS processing
- `uv` - Fast Python package manager

## Configuration Management

### Main App
- Stored in IndexedDB (`config` store)
- Managed via `ConfigWizard.tsx`
- No environment variables needed

### FioFetch
- Multiple sources (CLI, env, YAML file)
- Priority: CLI > env > file > defaults
- Config location: `~/.config/fio_fetch/config.yaml`

### Environment Variables
```bash
# FioFetch
FIO_FETCH_TOKEN=xxx         # Fio Bank API token
FIO_FETCH_HOST=0.0.0.0      # Bind address
FIO_FETCH_PORT=3000         # Port number
FIO_FETCH_DB_PATH=path      # Database path
FIO_FETCH_STATIC_DIR=path   # Frontend static files
```

## API Authentication

### Fio Bank API
- Token-based authentication
- Token obtained from Fio Bank internet banking
- Included in URL: `https://fioapi.fio.cz/v1/rest/periods/{token}/...`
- No OAuth or session management

### Internal APIs (FioFetch)
- No authentication currently
- Designed for local/trusted network use
- Production deployments should add auth layer (reverse proxy)

## Data Models

### SPAYD Payment
```typescript
interface Payment {
  id: string;
  timestamp: number;
  account: {
    name: string;
    iban: string;
  };
  amount: number;
  currency: string;
  variableSymbol?: string;
  message?: string;
  qrData: string; // Base64 encoded PNG
  spaydString: string;
}
```

### Fio Transaction
```python
class Transaction(BaseModel):
    id: int
    date: str
    amount: float
    currency: str
    counterparty: str | None
    description: str | None
    type: str  # "income" | "expense"
    variable_symbol: str | None
    specific_symbol: str | None
    constant_symbol: str | None
```

## Logging & Monitoring

### Frontend
- Console logging (development only)
- Error boundaries for component crashes
- No analytics in current implementation

### Backend
- Python logging module
- Log levels: DEBUG, INFO, WARNING, ERROR
- Log format: `[LEVEL] timestamp - message`
- Docker logs accessible via `docker logs`

## Performance Metrics

### Build Times
- Main app: ~5 seconds (dev), ~15 seconds (prod)
- FioFetch Docker: ~2-3 minutes (first build), ~30s (cached)

### Runtime Performance
- Main app: <100ms for QR generation
- FioFetch: <200ms API response time
- Docker: <5 seconds startup time

### Bundle Sizes
- Main app: ~150KB (gzipped)
- Batch app: ~180KB (gzipped)
- FioFetch UI: ~120KB (gzipped)

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported (iOS 14+)
- IE11: ❌ Not supported (ES6+ features)

## Mobile Compatibility

- iOS Safari: ✅ Responsive design
- Android Chrome: ✅ QR scanning works
- PWA capabilities: ✅ Can be installed as app

## Related Documentation

For detailed guides, see:
- [User Guide](docs/USER_GUIDE.md) - End-user documentation
- [FioFetch Guide](docs/FIOFETCH.md) - Transaction fetcher details
- [Docker Guide](DOCKER.md) - Complete Docker documentation
- [Development Guide](docs/DEVELOPMENT.md) - Setup and contribution
- [API Reference](docs/API.md) - REST API documentation
- [Batch Processing Guide](docs/BATCH.md) - Batch payment details

## Contributing

When modifying this codebase:
1. Follow existing patterns and conventions
2. Update relevant documentation in `docs/`
3. Test across browsers and mobile devices
4. Update `CHANGELOG.md` with changes
5. Ensure backward compatibility for storage schemas

## Questions for AI Agents

When working with this codebase, AI agents should consider:
1. **Storage migrations:** How to handle IndexedDB schema changes?
2. **Backward compatibility:** Will changes break existing user data?
3. **Multi-language:** Are UI changes reflected in both CS and EN?
4. **Docker builds:** Do changes require Dockerfile updates?
5. **API contracts:** Do backend changes affect frontend?

## Contact & Resources

- Repository: https://github.com/pexmor/spayd-applied
- Live Demo: https://pexmor.github.io/spayd-applied/
- SPAYD Spec: https://qr-platba.cz/
- Fio API Docs: https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf


# Development Guide

Guide for developers contributing to SPAYD Applied.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing](#testing)
6. [Building & Deployment](#building--deployment)
7. [Contributing](#contributing)

---

## Development Setup

### Prerequisites

**Required:**

- Node.js >= 16.x (recommend 20.x LTS)
- Yarn >= 1.22 or npm >= 8.x
- Git
- A modern code editor (VS Code recommended)

**For FioFetch:**

- Python >= 3.13
- `uv` package manager (or pip)
- Docker (optional, for containerized development)

### Initial Setup

**1. Clone the repository:**

```bash
git clone https://github.com/pexmor/spayd-applied.git
cd spayd-applied
```

**2. Install dependencies:**

```bash
# Main app + Batch app
yarn install

# FioFetch backend
cd fio_fetch_py
uv sync  # or: pip install -e .
cd ..

# FioFetch frontend
cd fio_fetch_webui
yarn install
cd ..
```

**3. Verify installation:**

```bash
# Main app
yarn dev

# FioFetch backend
cd fio_fetch_py
fiofetch

# FioFetch frontend
cd fio_fetch_webui
yarn dev
```

### Development Tools

**Recommended VS Code Extensions:**

- ESLint
- Prettier
- TypeScript and JavaScript
- Tailwind CSS IntelliSense
- Python
- Docker

**Browser DevTools:**

- Chrome DevTools (Application tab for IndexedDB)
- React DevTools (works with Preact)
- Network tab for API debugging

---

## Project Structure

### Main Application

```
src/
├── components/          # Preact components
│   ├── AccountManager.tsx
│   ├── EventManager.tsx
│   ├── PaymentForm.tsx
│   ├── PaymentHistory.tsx
│   ├── SyncQueue.tsx
│   ├── SettingsDialog.tsx
│   ├── ConfigWizard.tsx
│   ├── HamburgerMenu.tsx
│   ├── LanguageSwitcher.tsx
│   └── Dialog.tsx
├── services/            # Business logic
│   ├── payment-generator.ts
│   └── sync-service.ts
├── i18n/               # Translations
│   ├── index.ts
│   ├── cs.ts
│   └── en.ts
├── db.ts               # IndexedDB wrapper
├── I18nContext.tsx     # Language context
├── app.tsx             # Main app component
└── main.tsx            # Entry point
```

### Batch Application

```
src/batch/
├── BatchApp.tsx        # Main batch app
├── components/
│   ├── PeopleDataManager.tsx
│   ├── BatchAccountManager.tsx
│   ├── BatchEventManager.tsx
│   ├── EmailPreview.tsx
│   ├── ManualPaymentEntry.tsx
│   └── DataUpload.tsx
├── services/
│   ├── email-generator.tsx
│   └── storage.ts
├── templates/
│   └── PaymentEmail.tsx
└── utils/
    └── iban-generator.ts
```

### FioFetch Backend

```
fio_fetch_py/
└── fiofetch/
    ├── __main__.py      # CLI entry point
    ├── main.py          # FastAPI app
    ├── api.py           # API endpoints
    ├── fio.py           # Fio Bank client
    ├── database.py      # SQLite wrapper
    ├── models.py        # Pydantic models
    ├── services.py      # Business logic
    ├── config.py        # Configuration
    └── utils.py         # Utilities
```

### FioFetch Frontend

```
fio_fetch_webui/
└── src/
    ├── components/
    │   ├── Dashboard.jsx
    │   ├── TransactionList.jsx
    │   ├── FetchControl.jsx
    │   └── ConfigPanel.jsx
    ├── services/
    │   ├── api.js
    │   └── websocket.js
    ├── store/
    │   └── useAppStore.js
    ├── App.jsx
    └── index.jsx
```

---

## Development Workflow

### Running Development Servers

**Main App (SPAYD QR Generator):**

```bash
yarn dev
# Access at http://localhost:5173
```

**Batch App:**

```bash
yarn dev
# Access at http://localhost:5173/batch.html
```

**FioFetch Backend:**

```bash
cd fio_fetch_py
fiofetch --fio-token YOUR_TOKEN --debug
# Access at http://localhost:3000
```

**FioFetch Frontend:**

```bash
cd fio_fetch_webui
yarn dev
# Access at http://localhost:5174
# Configure proxy to backend at :3000
```

### Hot Reloading

All development servers support hot module replacement (HMR):

- Changes to source files trigger automatic reload
- Component state preserved where possible
- CSS updates without full reload

### Working with IndexedDB

**Inspect Storage:**

1. Open Chrome DevTools
2. Navigate to Application tab
3. Expand IndexedDB
4. Find databases: `spayd-db`, `batch-db`

**Clear Storage:**

```javascript
// In browser console
indexedDB.deleteDatabase("spayd-db");
indexedDB.deleteDatabase("batch-db");
location.reload();
```

**Migration Strategy:**
When changing schema:

1. Increment database version in `db.ts`
2. Add migration logic in `onupgradeneeded`
3. Test with existing data
4. Document in CHANGELOG.md

### Working with SQLite (FioFetch)

**Database Location:**

```bash
# Development
~/.config/fio_fetch/fio.db

# Docker
/root/.config/fio_fetch/fio.db
```

**Inspect Database:**

```bash
sqlite3 ~/.config/fio_fetch/fio.db
sqlite> .tables
sqlite> SELECT * FROM transactions LIMIT 5;
sqlite> .quit
```

**Reset Database:**

```bash
rm ~/.config/fio_fetch/fio.db
# Restart backend - will recreate tables
```

---

## Code Standards

### TypeScript / JavaScript

**Style Guide:**

- Use TypeScript for type safety
- Functional components (no classes)
- Hooks for state management
- Descriptive variable names
- Comments for complex logic

**Example Component:**

```typescript
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

interface Props {
  accountId: string;
  onSave: (data: AccountData) => void;
}

export const AccountForm = ({ accountId, onSave }: Props) => {
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSave({ name, iban });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="Account Name"
      />
      <input
        type="text"
        value={iban}
        onChange={(e) => setIban(e.currentTarget.value)}
        placeholder="IBAN"
      />
      <button type="submit">Save</button>
    </form>
  );
};
```

**Naming Conventions:**

- Components: PascalCase (`AccountManager.tsx`)
- Files: kebab-case for utilities (`payment-generator.ts`)
- Functions: camelCase (`generateQRCode`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- CSS classes: kebab-case (`payment-form`)

### Python

**Style Guide:**

- Follow PEP 8
- Type hints for all functions
- Docstrings for public APIs
- Async/await for I/O operations

**Example:**

```python
from typing import List, Optional
from pydantic import BaseModel

class Transaction(BaseModel):
    """Represents a bank transaction."""
    id: int
    amount: float
    description: Optional[str] = None

async def fetch_transactions(
    token: str,
    days_back: int = 30
) -> List[Transaction]:
    """
    Fetch transactions from Fio Bank API.

    Args:
        token: Fio Bank API token
        days_back: Number of days to fetch (1-365)

    Returns:
        List of Transaction objects

    Raises:
        ValueError: If days_back is out of range
        ConnectionError: If API is unreachable
    """
    if not 1 <= days_back <= 365:
        raise ValueError("days_back must be between 1 and 365")

    # Implementation
    ...
```

### CSS / Styling

**Approach:**

- TailwindCSS utility classes (primary)
- Custom CSS for complex components
- CSS modules not used (small project)
- Responsive design (mobile-first)

**Example:**

```tsx
// Prefer Tailwind utilities
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Save
</button>

// Custom CSS for special cases
<div className="payment-form-grid">
  {/* Complex grid layout */}
</div>
```

**Custom CSS File Structure:**

```css
/* app.css */
.payment-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
```

---

## Testing

### Unit Tests (FioFetch Backend)

**Framework:** pytest

**Run Tests:**

```bash
cd fio_fetch_py
pytest
# or
uv run pytest

# With coverage
pytest --cov=fiofetch --cov-report=html
```

**Test Structure:**

```python
# tests/test_api.py
import pytest
from fiofetch.api import mask_token

def test_mask_token():
    token = "ABC123XYZ789"
    masked = mask_token(token)
    assert masked == "ABC...789"
    assert len(masked) < len(token)

@pytest.mark.asyncio
async def test_fetch_transactions(mock_fio_client):
    transactions = await fetch_transactions(mock_fio_client)
    assert len(transactions) > 0
    assert transactions[0].amount > 0
```

**Writing Tests:**

1. Place in `tests/` directory
2. Name files `test_*.py`
3. Use fixtures for common setup
4. Mock external APIs
5. Test edge cases and errors

### Manual Testing

**Main App Testing Checklist:**

- [ ] Add account with valid IBAN
- [ ] Add account with invalid IBAN (should fail)
- [ ] Create event linked to account
- [ ] Generate QR code
- [ ] Scan QR with banking app
- [ ] View payment in history
- [ ] Clear history (verify deletion)
- [ ] Export/import settings
- [ ] Switch languages
- [ ] Test offline mode (disable network)

**Batch App Testing:**

- [ ] Import Excel file with people data
- [ ] Generate batch payments
- [ ] Preview email templates
- [ ] Export batch download
- [ ] Verify QR codes work
- [ ] Test email HTML rendering

**FioFetch Testing:**

- [ ] Configure with valid token
- [ ] Fetch transactions
- [ ] Set history limit
- [ ] View transaction details
- [ ] Export transactions
- [ ] Test error handling (invalid token)
- [ ] Test rate limiting

### Browser Compatibility Testing

**Target Browsers:**

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Mobile Testing:**

- iOS Safari (14+)
- Android Chrome (latest)

**Tools:**

- BrowserStack (cross-browser testing)
- Chrome DevTools device emulation
- Real devices when possible

---

## Building & Deployment

### Production Builds

**Main App:**

```bash
yarn build
# Output: dist/
```

**Batch App:**

```bash
yarn build
# Output: dist/batch.html
```

**FioFetch:**

```bash
# Backend - no build needed (Python)
# Frontend
cd fio_fetch_webui
yarn build
# Output: dist/
```

### Build Optimization

**Vite automatically:**

- Minifies JavaScript/CSS
- Tree shakes unused code
- Splits code into chunks
- Optimizes assets
- Generates source maps (dev only)

**Manual Optimization:**

```bash
# Analyze bundle size
yarn build
npx vite-bundle-visualizer

# Check for unused dependencies
npx depcheck
```

### GitHub Pages Deployment

**Automated Deployment:**

1. Push to `main` branch
2. GitHub Actions builds project
3. Deploys to `gh-pages` branch
4. Available at https://pexmor.github.io/spayd-applied/

**Manual Deployment:**

```bash
# Build
yarn build

# Copy to docs/app (for GitHub Pages)
./copy-dist-to-docs.sh

# Commit and push
git add docs/app
git commit -m "Update production build"
git push origin main
```

### Docker Deployment

**Build Image:**

```bash
./d10_build.sh
# or
docker build -t fiofetch:latest .
```

**Run Container:**

```bash
./d20_run.sh
# or
docker run -d -p 3000:3000 \
  -v ~/.config/fio_fetch:/root/.config/fio_fetch \
  fiofetch:latest
```

**Production Considerations:**

- Use reverse proxy (nginx/traefik)
- Enable HTTPS
- Set resource limits
- Configure monitoring
- Implement backup strategy

See [DOCKER.md](../DOCKER.md) for complete guide.

---

## Contributing

### Contribution Workflow

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Update documentation** (if needed)
6. **Commit with descriptive message:**
   ```bash
   git commit -m "feat: Add amazing feature"
   ```
7. **Push to your fork:**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process, dependencies

**Examples:**

```bash
feat(batch): Add Excel import for people data
fix(fiofetch): Correct Fio API URL
docs(readme): Update installation instructions
refactor(db): Simplify IndexedDB wrapper
```

### Pull Request Guidelines

**Before submitting:**

- [ ] Code follows project style
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for significant changes)
- [ ] No merge conflicts
- [ ] Descriptive PR title and description

**PR Description Template:**

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing

How to test these changes

## Screenshots (if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Code Review Process

1. Maintainer reviews PR
2. Feedback provided (if needed)
3. Author makes requested changes
4. Approved PRs merged to `main`
5. Deployment triggered (automatic)

### Getting Help

**Questions?**

- Check [AGENTS.md](../AGENTS.md) for architecture details
- Review existing issues on GitHub
- Ask in PR comments
- Contact maintainers

### Development Best Practices

1. **Small, focused commits**: One logical change per commit
2. **Write tests**: For new features and bug fixes
3. **Document as you go**: Update docs with code changes
4. **Keep dependencies updated**: Regular `yarn upgrade`
5. **Handle errors gracefully**: User-friendly error messages
6. **Consider accessibility**: Semantic HTML, ARIA labels
7. **Optimize performance**: Lazy loading, code splitting
8. **Security first**: Validate inputs, sanitize outputs

---

## Development Resources

### Documentation

- [AGENTS.md](../AGENTS.md) - Architecture and design
- [USER_GUIDE.md](USER_GUIDE.md) - Feature documentation
- [API.md](API.md) - API reference
- [DOCKER.md](../DOCKER.md) - Docker deployment

### External Resources

- [Preact Documentation](https://preactjs.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SPAYD Specification](https://qr-platba.cz/)
- [Fio Bank API Docs](https://www.fio.cz/docs/cz/API_Bankovnictvi.pdf)

### Tools

- [Vite Bundle Analyzer](https://www.npmjs.com/package/vite-bundle-visualizer)
- [SQLite Browser](https://sqlitebrowser.org/)
- [Postman](https://www.postman.com/) - API testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**Happy coding! 🚀**

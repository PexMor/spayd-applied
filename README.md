# SPAYD Applied

**Live Demo:** <https://pexmor.github.io/spayd-applied/>

A comprehensive suite of tools for Czech banking operations:
- **SPAYD QR Payment Generator** - Create standard Czech QR payment codes (SPAYD format)
- **Batch Payment Processor** - Generate multiple payment requests with email notifications
- **FioFetch** - Transaction fetcher and manager for Fio Bank API

## Quick Start

### SPAYD QR Generator

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

Access at `http://localhost:5173`

### FioFetch (Docker)

```bash
# Build and run
./d10_build.sh && ./d20_run.sh

# Access at http://localhost:3000
```

## Documentation

📚 **Detailed documentation in [`docs/`](docs/):**

- **[Architecture & Design](AGENTS.md)** - Technical overview for developers and AI agents
- **[User Guide](docs/USER_GUIDE.md)** - Feature walkthrough and screenshots
- **[FioFetch Guide](docs/FIOFETCH.md)** - Transaction fetcher documentation
- **[Docker Deployment](DOCKER.md)** - Complete Docker setup guide
- **[Batch Processing](docs/BATCH.md)** - Batch payment generation guide
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup and contribution guidelines
- **[API Reference](docs/API.md)** - REST API documentation

## Features

- ✅ QR code generation for Czech SPAYD payments
- ✅ Multi-account and event management
- ✅ Offline-first with IndexedDB storage
- ✅ Batch payment processing with email templates
- ✅ Fio Bank transaction fetching and management
- ✅ Internationalization (Czech/English)
- ✅ Docker deployment ready

## Tech Stack

- **Frontend:** Preact, TypeScript, Vite, TailwindCSS
- **Backend:** Python 3.13, FastAPI, SQLite
- **Storage:** IndexedDB (browser), SQLite (server)
- **Deployment:** Docker, GitHub Pages

## License

See [LICENSE](LICENSE) file for details.

---

For detailed information, see [AGENTS.md](AGENTS.md) and the [`docs/`](docs/) directory.

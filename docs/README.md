# SPAYD Applied Documentation

**Live Demo:** <https://pexmor.github.io/spayd-applied/app/>

Comprehensive documentation for the SPAYD Applied suite of applications.

## 📚 Documentation Index

### Getting Started
- **[User Guide](USER_GUIDE.md)** - Complete user documentation with screenshots and tutorials
- **[Quick Start](../README.md)** - Fast setup for all components

### Technical Documentation
- **[AGENTS.md](../AGENTS.md)** - Architecture overview and design decisions for developers and AI agents
- **[Development Guide](DEVELOPMENT.md)** - Setup, contribution guidelines, and development workflow
- **[API Reference](API.md)** - REST API documentation for FioFetch backend

### Component Guides
- **[FioFetch Guide](FIOFETCH.md)** - Complete guide for the transaction fetcher
- **[Batch Processing Guide](BATCH.md)** - Batch payment generation and email templates
- **[Docker Deployment](../DOCKER.md)** - Docker setup, configuration, and troubleshooting

### Additional Resources
- **[FioFetch Changes](FIOFETCH_CHANGES.md)** - Recent changes and bug fixes
- **[Changelog](../CHANGELOG.md)** - Project version history

---

## 🎯 Quick Links by Role

### For Users
- [How do I generate a QR payment?](USER_GUIDE.md#1-generate-qr-payment)
- [How do I set up batch payments?](BATCH.md#quick-start)
- [How do I fetch bank transactions?](FIOFETCH.md#getting-started)
- [What is history limit (zárazka)?](FIOFETCH.md#understanding-history-limit)

### For Developers
- [Project architecture](../AGENTS.md#architecture)
- [Development setup](DEVELOPMENT.md#development-setup)
- [API endpoints](API.md#endpoints)
- [Contributing guidelines](DEVELOPMENT.md#contributing)

### For DevOps
- [Docker deployment](../DOCKER.md#quick-start)
- [Configuration options](FIOFETCH.md#configuration)
- [Backup strategies](FIOFETCH.md#backup-strategies)
- [Troubleshooting](../DOCKER.md#troubleshooting)

---

## 🚀 Live Demos

- **SPAYD QR Generator:** https://pexmor.github.io/spayd-applied/
- **Batch Processor:** https://pexmor.github.io/spayd-applied/app/batch.html
- **FioFetch:** Self-hosted (see [Docker Guide](../DOCKER.md))

---

## 📖 Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── USER_GUIDE.md          # End-user documentation
├── DEVELOPMENT.md         # Developer setup and guidelines
├── API.md                 # REST API reference
├── BATCH.md               # Batch payment processing guide
├── FIOFETCH.md            # Transaction fetcher guide
└── FIOFETCH_CHANGES.md    # Recent changes and fixes

Root-level documentation:
├── README.md              # Project overview (minimal)
├── AGENTS.md              # Architecture for developers/AI
├── CHANGELOG.md           # Version history
└── DOCKER.md              # Docker deployment guide
```

---

## 🔍 What's What?

### SPAYD QR Generator (Main App)
Generate Czech QR payment codes (SPAYD format) for banking apps.
- **Docs:** [User Guide](USER_GUIDE.md#spayd-qr-generator)
- **Tech:** Preact, TypeScript, IndexedDB
- **Use case:** Individual payment requests

### Batch Payment Processor
Generate multiple payment requests with email templates.
- **Docs:** [Batch Guide](BATCH.md)
- **Tech:** Preact, TypeScript, XLSX parsing
- **Use case:** Event invoicing, bulk payments

### FioFetch
Fetch and manage transactions from Fio Bank API.
- **Docs:** [FioFetch Guide](FIOFETCH.md)
- **Tech:** Python FastAPI, SQLite, Docker
- **Use case:** Transaction history, reconciliation

---

## 🛠️ Common Tasks

### I want to...

**Generate a single QR payment:**
→ [User Guide: Generate QR Payment](USER_GUIDE.md#1-generate-qr-payment)

**Send payment requests to multiple people:**
→ [Batch Guide: Quick Start](BATCH.md#quick-start)

**Fetch my bank transactions:**
→ [FioFetch Guide: Getting Started](FIOFETCH.md#getting-started)

**Deploy with Docker:**
→ [Docker Guide: Quick Start](../DOCKER.md#quick-start)

**Contribute to the project:**
→ [Development Guide: Contributing](DEVELOPMENT.md#contributing)

**Understand the architecture:**
→ [AGENTS.md: Architecture](../AGENTS.md#architecture)

**Use the REST API:**
→ [API Reference](API.md)

**Fix a 422 error in FioFetch:**
→ [FioFetch: Understanding History Limit](FIOFETCH.md#understanding-history-limit)

---

## 💡 Key Features

### SPAYD QR Generator
- ✅ Offline-first (works without internet)
- ✅ Account and event management
- ✅ Payment history tracking
- ✅ Optional webhook sync
- ✅ Czech and English languages

### Batch Processor
- ✅ Excel/CSV import
- ✅ Personalized email generation
- ✅ Batch QR code export
- ✅ Variable Symbol auto-generation
- ✅ Payment tracking

### FioFetch
- ✅ Automatic transaction fetching
- ✅ SQLite storage
- ✅ REST API
- ✅ WebSocket updates
- ✅ JSON/CSV export
- ✅ Docker deployment

---

## 🆘 Getting Help

### Documentation
1. Check the relevant guide above
2. Review [AGENTS.md](../AGENTS.md) for technical details
3. Read [troubleshooting sections](FIOFETCH.md#troubleshooting)

### Common Issues
- **QR won't scan:** [User Guide: Troubleshooting](USER_GUIDE.md#troubleshooting)
- **Docker won't start:** [Docker Guide: Troubleshooting](../DOCKER.md#troubleshooting)
- **API errors:** [API Reference: Error Codes](API.md#error-codes)

### Reporting Issues
Include:
- Which component (main app, batch, FioFetch)
- Steps to reproduce
- Error messages or logs
- Expected vs actual behavior

---

## 📝 Documentation Principles

This documentation follows these principles:

1. **Single Source of Truth** - No duplicate or conflicting information
2. **Minimal Root** - Only README, AGENTS, CHANGELOG, DOCKER in root
3. **Comprehensive docs/** - All detailed guides here
4. **Cross-referenced** - Links between related documents
5. **User-focused** - Written for both humans and AI agents
6. **Current** - Updated with code changes

---

## 🔄 Recent Updates

See [CHANGELOG.md](../CHANGELOG.md) for version history.

Latest features:
- ✨ History limit (zárazka) for FioFetch
- 🔒 Token masking in logs
- 🐛 Fixed Fio Bank API URL
- 📚 Comprehensive documentation restructure

---

**Need something specific? Check the [User Guide](USER_GUIDE.md) or [AGENTS.md](../AGENTS.md)!**
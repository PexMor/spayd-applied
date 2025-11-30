# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure in `docs/` directory
- `AGENTS.md` for architectural overview and AI agent assistance
- Structured changelog following Keep a Changelog format

### Changed
- README.md streamlined to be more concise with references to detailed documentation
- Documentation organization following single source of truth principle

## [2.1.0] - 2025-11-28

### Added
- **FioFetch**: Back date days (history limit) feature to prevent 422 API errors
- Token masking in logs and error messages for security
- Input validation for history limit (1-365 days)
- Comprehensive error handling with user-friendly messages
- API endpoint: `POST /api/v1/set-last-date` for setting history limit

### Changed
- Fixed Fio Bank API URL from `www.fioapi.cz` to `fioapi.fio.cz`
- Improved error handling in FioFetch backend and frontend
- Enhanced FetchControl component with better UX (auto-clear success messages)

### Fixed
- DNS resolution error when calling Fio Bank API
- 500 Internal Server Error in `/api/v1/set-last-date` endpoint
- Missing `requests` dependency in `pyproject.toml`
- Security issue: API tokens exposed in error logs
- Frontend validation allowing invalid values for history limit

### Security
- Added `mask_token()` function to mask sensitive tokens in all logs and error messages

## [2.0.0] - 2025-11-15

### Added
- **Docker deployment** support with multi-stage builds
- Docker helper scripts: `d10_build.sh`, `d20_run.sh`, `d30_stop.sh`, `d40_logs.sh`
- Comprehensive Docker documentation in `DOCKER.md`
- `docker-compose.yml` for orchestrated deployment
- Makefile with common Docker commands
- Health checks and auto-restart policies for containers
- Volume mapping for persistent data storage
- Demo transaction data for testing without API token

### Changed
- FioFetch optimized for containerized deployment
- Configuration management improved with multiple sources (CLI, env, YAML)
- Static file serving architecture updated for Docker

## [1.5.0] - 2025-10-20

### Added
- **Batch Payment Processor** - New application for bulk payment generation
- Excel/CSV import for people data
- Email template generator with HTML and text formats
- Batch export functionality (ZIP with HTML files and QR codes)
- Manual payment entry interface
- IBAN validation using `ibantools` and `ibankit` libraries
- Variable Symbol auto-generation from person data

### Changed
- Separated batch app storage from main app (separate IndexedDB database)
- Enhanced IBAN generation utilities

## [1.0.0] - 2025-09-01

### Added
- **FioFetch** - Transaction fetcher for Fio Bank API
- Python FastAPI backend with REST API
- Preact-based web UI for transaction management
- SQLite database for transaction storage
- WebSocket support for real-time updates
- Configuration management (CLI, environment variables, YAML file)
- Multiple API endpoints for transaction and config management

### Changed
- Project reorganized as monorepo with multiple applications
- Updated build system to support multiple entry points

## [0.5.0] - 2025-07-15

### Added
- **Sync Queue** feature for webhook integration
- Retry mechanism with exponential backoff
- Sync status monitoring UI
- Queue persistence in IndexedDB

### Changed
- Improved error handling for network operations
- Enhanced payment history with sync status indicators

## [0.4.0] - 2025-06-01

### Added
- **Internationalization** support (Czech and English)
- Language switcher component
- Translation system using context API
- Localized date and number formatting

### Changed
- All UI text externalized to translation files
- Settings dialog updated with language selection

## [0.3.0] - 2025-04-15

### Added
- **Global Configuration** dialog
- Webhook URL configuration for payment sync
- Application settings persistence
- Settings import/export functionality

### Changed
- Configuration moved to dedicated settings dialog
- Improved UX for configuration management

## [0.2.0] - 2025-03-01

### Added
- **Payment History** feature with full transaction log
- History viewer with search and filter capabilities
- History export to JSON
- History clearing functionality
- Account Manager for CRUD operations on bank accounts
- Event Manager for payment event definitions

### Changed
- Enhanced data persistence with IndexedDB
- Improved UI/UX with better navigation

### Fixed
- QR code generation edge cases
- IBAN validation issues

## [0.1.0] - 2025-01-15

### Added
- Initial release of SPAYD QR Payment Generator
- Core QR code generation functionality
- SPAYD format encoding
- Basic payment form (account, amount, VS, message)
- QR code display and download
- Offline-first architecture with IndexedDB storage
- Responsive design with TailwindCSS
- Built with Preact and Vite

### Technical Stack
- Preact 10.16 for UI
- TypeScript 5.0 for type safety
- Vite 4.4 for build tooling
- TailwindCSS 3.4 for styling
- IndexedDB for local storage
- SPAYD library for payment encoding
- QRCode library for QR generation

## Version History Summary

- **0.1.0** - Initial SPAYD QR Generator
- **0.2.0** - Added history, accounts, and events management
- **0.3.0** - Global configuration and settings
- **0.4.0** - Internationalization (CS/EN)
- **0.5.0** - Sync queue and webhook integration
- **1.0.0** - FioFetch transaction fetcher added
- **1.5.0** - Batch payment processor added
- **2.0.0** - Docker deployment and containerization
- **2.1.0** - FioFetch improvements and bug fixes

---

## Notes on Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes or major features
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

## Upgrade Guide

### Upgrading from 1.x to 2.x
- Docker support added; consider containerized deployment
- No breaking changes to existing functionality
- Data migrations: None required (storage schemas unchanged)

### Upgrading from 0.x to 1.x
- New FioFetch component requires separate setup
- Main app remains backward compatible
- No data migration needed for main app

## Future Roadmap

See [AGENTS.md](AGENTS.md) for planned enhancements and technical debt.


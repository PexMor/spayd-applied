# Docker Deployment Guide for FioFetch

Complete guide for building, running, and managing the FioFetch application using Docker.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Building the Image](#building-the-image)
- [Running the Container](#running-the-container)
- [Configuration](#configuration)
- [Container Management](#container-management)
- [Volume Mapping & Data Persistence](#volume-mapping--data-persistence)
- [Available Scripts](#available-scripts)
- [Make Commands](#make-commands)
- [Docker Compose](#docker-compose)
- [Demo Data](#demo-data)
- [Environment Variables](#environment-variables)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)
- [Performance & Optimization](#performance--optimization)
- [Security](#security)
- [Production Deployment](#production-deployment)
- [Updates & Maintenance](#updates--maintenance)

---

## Overview

The Docker setup combines both the Python backend (`fio_fetch_py`) and the React frontend (`fio_fetch_webui`) into a single container:

- **Multi-stage build** optimized for production
- **Frontend**: Preact/Vite app built with Yarn 4
- **Backend**: Python 3.13 FastAPI application
- **Final image size**: ~255 MB
- **Cross-platform**: Works on Linux, macOS, and Windows

### Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
│  ┌────────────────────────────────────┐ │
│  │  Preact Web UI (Built with Vite)   │ │
│  └────────────────────────────────────┘ │
│                   ↓                     │
│  ┌────────────────────────────────────┐ │
│  │  FastAPI Backend (Python 3.13)     │ │
│  │  - REST API (/api/v1/*)            │ │
│  │  - WebSocket Support               │ │
│  └────────────────────────────────────┘ │
│                   ↓                     │
│  ┌────────────────────────────────────┐ │
│  │  SQLite Database (via volume)      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↕ (Port 3000)
┌─────────────────────────────────────────┐
│         Host Machine                    │
│  ~/.config/fio_fetch/                   │
│  ├── config.yaml  (Configuration)       │
│  └── fio.db       (Database)            │
└─────────────────────────────────────────┘
```

---

## Quick Start

**Ready in 2 minutes!** ⚡

### Method 1: Using Shell Scripts (Recommended)

```bash
# 1. Build the Docker Image
./d10_build.sh

# 2. Run the Container
./d20_run.sh

# 3. Access at http://localhost:3000
```

### Method 2: Using Make

```bash
# 1. Build
make build

# 2. Run
make run

# 3. Access at http://localhost:3000
```

### Method 3: Using Docker Compose

```bash
# 1. Build first
./d10_build.sh

# 2. Start with compose
docker-compose up -d

# 3. Access at http://localhost:3000
```

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Internet connection** (for initial build)
- 🔑 **Fio Bank API token** (optional, can configure later via web UI)

### Verify Docker is Running

```bash
docker info
```

If this fails, start Docker Desktop application.

---

## Building the Image

### Using the Build Script

```bash
# Build with defaults (fiofetch:latest)
./d10_build.sh

# Build with custom name and tag
./d10_build.sh myfiofetch v1.0.0
```

**Build time**: ~2-3 minutes on first build, ~30 seconds for subsequent builds (cached).

### What Happens During Build

1. **Stage 1**: Builds the web UI using Node.js 22 + Yarn 4
   - Installs dependencies with Yarn (Corepack)
   - Builds production-optimized Preact app
2. **Stage 2**: Builds the Python backend
   - Installs Python 3.13 and system dependencies
   - Installs `uv` for fast package management
   - Installs fiofetch package and dependencies
   - Copies built web UI from Stage 1
   - Includes demo transaction data

### Build Options

```bash
# Using Make
make build

# Using Docker directly
docker build -t fiofetch:latest .

# Build with no cache
docker build --no-cache -t fiofetch:latest .
```

---

## Running the Container

### Using the Run Script

```bash
# Run with defaults
./d20_run.sh

# Run with custom settings
./d20_run.sh myfiofetch v1.0.0

# Run on different port
FIO_FETCH_PORT=8080 ./d20_run.sh

# Run with API token
FIO_FETCH_TOKEN=your_token ./d20_run.sh

# Run with custom container name
CONTAINER_NAME=my-fiofetch ./d20_run.sh

# Combine options
FIO_FETCH_PORT=8080 FIO_FETCH_TOKEN=your_token ./d20_run.sh
```

### Using Make

```bash
# Run with defaults
make run

# Run on custom port
FIO_FETCH_PORT=8080 make run
```

### Using Docker Directly

```bash
# Linux/macOS
docker run -d \
  --name fiofetch \
  -p 3000:3000 \
  -v "$HOME/.config/fio_fetch:/root/.config/fio_fetch" \
  -e FIO_FETCH_TOKEN=your_token \
  --restart unless-stopped \
  fiofetch:latest

# Windows (PowerShell)
docker run -d `
  --name fiofetch `
  -p 3000:3000 `
  -v "${env:USERPROFILE}\.config\fio_fetch:/root/.config/fio_fetch" `
  -e FIO_FETCH_TOKEN=your_token `
  --restart unless-stopped `
  fiofetch:latest
```

### Verify It's Running

```bash
# Check status
docker ps | grep fiofetch

# View logs
docker logs fiofetch

# Check health
docker inspect fiofetch --format='{{.State.Health.Status}}'
# Should show: healthy

# Access the application
curl http://localhost:3000
```

---

## Configuration

### Option 1: Via Web UI (Easiest) ⭐

1. Start the container: `./d20_run.sh`
2. Open http://localhost:3000
3. Click **Configuration** tab
4. Enter your Fio Bank API token
5. Click **Save**

Token is automatically saved to `~/.config/fio_fetch/config.yaml`.

### Option 2: Via Environment Variable

```bash
FIO_FETCH_TOKEN=your_token_here ./d20_run.sh
```

### Option 3: Via Configuration File

Create `~/.config/fio_fetch/config.yaml`:

```yaml
host: 0.0.0.0
port: 3000
fio-token: YOUR_FIO_BANK_TOKEN
static-dir: /app/static
db-path: /root/.config/fio_fetch/fio.db
```

Then run:

```bash
./d20_run.sh
```

---

## Container Management

### View Logs

```bash
# Follow logs in real-time
./d40_logs.sh
# or
docker logs -f fiofetch
# or
make logs

# Last 50 lines
./d40_logs.sh --tail 50
# or
docker logs --tail 50 fiofetch

# Logs since 1 hour ago
./d40_logs.sh --since 1h
```

### Stop the Container

```bash
# Using script
./d30_stop.sh

# Using Make
make stop

# Using Docker
docker stop fiofetch
```

### Start/Restart

```bash
# Start stopped container
docker start fiofetch
# or
make restart

# Restart running container
docker restart fiofetch
```

### Remove the Container

```bash
# Stop and remove
./d30_stop.sh --remove

# Using Make
make clean

# Using Docker
docker rm -f fiofetch
```

### Access Container Shell

```bash
# Interactive shell
docker exec -it fiofetch /bin/bash

# Or using Make
make shell

# Run a command
docker exec fiofetch ls -la /app/
```

### Check Status

```bash
# Container status
docker ps | grep fiofetch
# or
make status

# Health check
docker inspect fiofetch --format='{{.State.Health.Status}}'
# or
make health

# Resource usage
docker stats fiofetch
```

---

## Volume Mapping & Data Persistence

Configuration and database files persist on your host machine:

| OS          | Host Path                          | Container Path             |
| ----------- | ---------------------------------- | -------------------------- |
| **Linux**   | `~/.config/fio_fetch/`             | `/root/.config/fio_fetch/` |
| **macOS**   | `~/.config/fio_fetch/`             | `/root/.config/fio_fetch/` |
| **Windows** | `%USERPROFILE%\.config\fio_fetch\` | `/root/.config/fio_fetch/` |

### Files Persisted

- `config.yaml` - Application configuration and API token
- `fio.db` - SQLite database with transaction history

### Access Your Data

```bash
# View config directory
ls -la ~/.config/fio_fetch/

# View config file
cat ~/.config/fio_fetch/config.yaml

# Backup your data
cp -r ~/.config/fio_fetch/ ~/backups/fio_fetch-$(date +%Y%m%d)/
```

**Important**: Data persists even if you remove and recreate the container!

---

## Available Scripts

| Script         | Purpose            | Usage                                       |
| -------------- | ------------------ | ------------------------------------------- |
| `d10_build.sh` | Build Docker image | `./d10_build.sh [image_name] [tag]`         |
| `d20_run.sh`   | Run container      | `./d20_run.sh [image_name] [tag] [options]` |
| `d30_stop.sh`  | Stop container     | `./d30_stop.sh [container_name] [--remove]` |
| `d40_logs.sh`  | View logs          | `./d40_logs.sh [container_name] [options]`  |

### Script Examples

```bash
# Build custom version
./d10_build.sh fiofetch v2.0.0

# Run on port 8080 with token
FIO_FETCH_PORT=8080 FIO_FETCH_TOKEN=mytoken ./d20_run.sh

# Stop and remove
./d30_stop.sh --remove

# View last 100 log lines
./d40_logs.sh --tail 100
```

---

## Make Commands

For convenience, use the provided Makefile:

### Build & Run

```bash
make build          # Build Docker image
make run            # Start container
make rebuild        # Stop, rebuild, and restart
```

### Management

```bash
make stop           # Stop container
make restart        # Restart container
make clean          # Stop and remove container
make clean-all      # Remove container and images
```

### Monitoring

```bash
make logs           # Follow logs in real-time
make logs-tail      # Show last 50 lines
make status         # Show container status
make health         # Check container health
make ps             # List all FioFetch containers
```

### Advanced

```bash
make shell          # Access container shell
make images         # List FioFetch images
make help           # Show all available commands
```

### Docker Compose Shortcuts

```bash
make compose-up     # Start with docker-compose
make compose-down   # Stop docker-compose
make compose-logs   # View compose logs
```

---

## Docker Compose

Alternative deployment method using `docker-compose.yml`:

```yaml
services:
  fiofetch:
    image: fiofetch:latest
    container_name: fiofetch
    ports:
      - "3000:3000"
    volumes:
      - ~/.config/fio_fetch:/root/.config/fio_fetch
    environment:
      - FIO_FETCH_TOKEN=${FIO_FETCH_TOKEN:-}
      - FIO_FETCH_HOST=0.0.0.0
      - FIO_FETCH_PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

### Usage

```bash
# Build image first
./d10_build.sh

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart
docker-compose restart
```

---

## Demo Data

The container includes sample transaction data for testing without a real API token:

**Location**: `/app/examples/tr.json`

**Contents**:

- Sample Fio Bank account statement
- 3 transactions (2 transfers + 1 interest payment)
- Account: CZ7920100000002400222222
- Currency: CZK
- Opening balance: 195.00 CZK
- Closing balance: 195.01 CZK

### Access Demo Data

```bash
# View demo file
docker exec fiofetch cat /app/examples/tr.json

# List examples directory
docker exec fiofetch ls -la /app/examples/
```

---

## Environment Variables

### Runtime Variables

Set these when running the container:

| Variable          | Description            | Default    |
| ----------------- | ---------------------- | ---------- |
| `FIO_FETCH_TOKEN` | Fio Bank API token     | (none)     |
| `FIO_FETCH_PORT`  | Port to expose on host | `3000`     |
| `CONTAINER_NAME`  | Container name         | `fiofetch` |

### Container Environment

These are set inside the container:

| Variable               | Value                            |
| ---------------------- | -------------------------------- |
| `FIO_FETCH_HOST`       | `0.0.0.0`                        |
| `FIO_FETCH_PORT`       | `3000`                           |
| `FIO_FETCH_DB_PATH`    | `/root/.config/fio_fetch/fio.db` |
| `FIO_FETCH_STATIC_DIR` | `/app/static`                    |
| `PATH`                 | `/root/.local/bin:$PATH`         |

---

## Advanced Usage

### Running Multiple Instances

```bash
# Instance 1 on port 3000
FIO_FETCH_PORT=3000 CONTAINER_NAME=fiofetch-1 ./d20_run.sh

# Instance 2 on port 3001
FIO_FETCH_PORT=3001 CONTAINER_NAME=fiofetch-2 ./d20_run.sh

# Instance 3 on port 3002
FIO_FETCH_PORT=3002 CONTAINER_NAME=fiofetch-3 ./d20_run.sh
```

### Custom Docker Options

Pass additional options as the third parameter:

```bash
# Limit CPU and memory
./d20_run.sh fiofetch latest "--cpus=2 --memory=512m"

# Custom network
./d20_run.sh fiofetch latest "--network=my-network"

# Add labels
./d20_run.sh fiofetch latest "--label=env=prod --label=app=fiofetch"

# Combine multiple options
./d20_run.sh fiofetch latest "--cpus=2 --memory=1g --network=my-net"
```

### Resource Limits

```bash
# Set limits via Docker
docker run -d \
  --name fiofetch \
  --cpus=2 \
  --memory=1g \
  --memory-swap=2g \
  -p 3000:3000 \
  -v "$HOME/.config/fio_fetch:/root/.config/fio_fetch" \
  fiofetch:latest
```

### Custom Networks

```bash
# Create network
docker network create fio-network

# Run with custom network
docker run -d \
  --name fiofetch \
  --network fio-network \
  -p 3000:3000 \
  -v "$HOME/.config/fio_fetch:/root/.config/fio_fetch" \
  fiofetch:latest
```

---

## Troubleshooting

### Container Won't Start

**Check logs**:

```bash
docker logs fiofetch
# or
./d40_logs.sh --tail 50
```

**Check if already running**:

```bash
docker ps -a | grep fiofetch
```

**Common causes**:

- Port already in use → Use different port: `FIO_FETCH_PORT=8080 ./d20_run.sh`
- Container already exists → Remove it: `docker rm -f fiofetch`
- Permission issues → Check volume permissions: `ls -la ~/.config/fio_fetch`

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
FIO_FETCH_PORT=8080 ./d20_run.sh
```

### Cannot Connect to Docker Daemon

**Start Docker Desktop**:

- **macOS/Windows**: Open Docker Desktop application
- **Linux**: `sudo systemctl start docker`

**Verify Docker is running**:

```bash
docker info
```

### Permission Denied on Scripts

```bash
# Make scripts executable
chmod +x d10_build.sh d20_run.sh d30_stop.sh d40_logs.sh
```

### Volume Mapping Issues on Windows

**Check path in script output**:

```bash
./d20_run.sh
# Look for "Config directory:" in output
```

**Manual path specification**:

```bash
docker run -d \
  --name fiofetch \
  -p 3000:3000 \
  -v "/c/Users/YourUsername/.config/fio_fetch:/root/.config/fio_fetch" \
  fiofetch:latest
```

### Build Failures

**Clean Docker system**:

```bash
docker system prune -f
```

**Rebuild from scratch**:

```bash
docker build --no-cache -t fiofetch:latest .
```

**Check disk space**:

```bash
df -h
docker system df
```

### Health Check Failures

**View health check logs**:

```bash
docker inspect fiofetch --format='{{json .State.Health}}' | python -m json.tool
```

**Check if application is responding**:

```bash
curl http://localhost:3000/
```

---

## Performance & Optimization

### Image Size

- **Total**: ~255 MB
- **Base images**: 180 MB (Python + Node)
- **Dependencies**: ~60 MB
- **Application**: ~15 MB

**Check your image size**:

```bash
docker images fiofetch
```

### Build Time

- **First build**: 2-3 minutes
- **Subsequent builds**: 30 seconds (cached layers)
- **No-cache build**: 3-4 minutes

### Runtime Performance

- **Startup time**: <5 seconds
- **Memory usage**: 150-200 MB
- **CPU usage**: <1% idle, <10% under load

### Optimization Tips

1. **Use cached builds** - Don't use `--no-cache` unless necessary
2. **Set resource limits** - Prevent resource hogging
3. **Enable health checks** - Automatic recovery
4. **Use restart policy** - Auto-restart on failure

---

## Security

### API Token Security

✅ **Best Practices**:

- Use environment variables
- Never commit tokens to git
- Use Docker secrets in production
- Rotate tokens regularly

❌ **Avoid**:

- Hardcoding tokens in Dockerfile
- Committing config files with tokens
- Sharing tokens in plain text

### Network Security

**Production recommendations**:

- Use reverse proxy (nginx/traefik)
- Enable HTTPS/TLS
- Add authentication layer
- Use firewall rules
- Don't expose directly to internet

### Container Security

```bash
# Run as non-root user (future improvement)
# Use read-only filesystem where possible
# Limit capabilities
# Use security scanning

docker scan fiofetch:latest
```

### Update Management

```bash
# Regular updates
./d30_stop.sh --remove
git pull
./d10_build.sh
./d20_run.sh

# Or use Make
make rebuild
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Set up reverse proxy (nginx/traefik)
- [ ] Configure HTTPS/TLS certificates
- [ ] Set resource limits
- [ ] Configure monitoring & logging
- [ ] Set up automated backups
- [ ] Use secrets management
- [ ] Test disaster recovery
- [ ] Document deployment process

### Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name fiofetch.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fiofetch.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Monitoring

**Health checks**:

```bash
# Check every minute
*/1 * * * * curl -f http://localhost:3000/ || alert-team
```

**Log aggregation**:

```bash
# Forward logs to central system
docker logs -f fiofetch | logger -t fiofetch
```

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR=~/backups/fio_fetch
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp -r ~/.config/fio_fetch/ $BACKUP_DIR/fio_fetch_$DATE
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +
```

---

## Updates & Maintenance

### Update Workflow

```bash
# 1. Stop container
./d30_stop.sh

# 2. Pull latest code
git pull

# 3. Rebuild image
./d10_build.sh

# 4. Start container
./d20_run.sh

# Or use Make
make rebuild
```

**Your data is preserved** in `~/.config/fio_fetch/`!

### Rollback Procedure

```bash
# Stop current version
docker stop fiofetch
docker rm fiofetch

# Run previous version
docker run -d \
  --name fiofetch \
  -p 3000:3000 \
  -v "$HOME/.config/fio_fetch:/root/.config/fio_fetch" \
  fiofetch:v1.0.0  # Previous tag
```

### Cleaning Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove everything unused
docker system prune -a

# Or use Make
make clean-all
```

---

## Quick Reference

### Common Commands

| Task    | Shell Script     | Make Command   | Docker Command                   |
| ------- | ---------------- | -------------- | -------------------------------- |
| Build   | `./d10_build.sh` | `make build`   | `docker build -t fiofetch .`     |
| Run     | `./d20_run.sh`   | `make run`     | `docker run -d -p 3000:3000 ...` |
| Stop    | `./d30_stop.sh`  | `make stop`    | `docker stop fiofetch`           |
| Logs    | `./d40_logs.sh`  | `make logs`    | `docker logs -f fiofetch`        |
| Restart | -                | `make restart` | `docker restart fiofetch`        |
| Shell   | -                | `make shell`   | `docker exec -it fiofetch bash`  |
| Status  | -                | `make status`  | `docker ps \| grep fiofetch`     |
| Rebuild | -                | `make rebuild` | Stop, build, run                 |

### One-Liners

```bash
# Full setup
./d10_build.sh && ./d20_run.sh

# With token
./d10_build.sh && FIO_FETCH_TOKEN=your_token ./d20_run.sh

# Full rebuild
./d30_stop.sh --remove && ./d10_build.sh && ./d20_run.sh

# Quick log check
./d40_logs.sh --tail 20 --since 5m
```

---

## Support & Resources

### Documentation

- **API Documentation**: http://localhost:3000/docs (Swagger UI)
- **ReDoc**: http://localhost:3000/redoc
- **Backend README**: [fio_fetch_py/README.md](fio_fetch_py/README.md)
- **Frontend README**: [fio_fetch_webui/README.md](fio_fetch_webui/README.md)
- **Main README**: [README.md](README.md)

### Getting Help

1. **Check logs**: `docker logs fiofetch`
2. **Review this guide**: Common issues covered above
3. **Test with demo data**: `/app/examples/tr.json`
4. **Check API docs**: http://localhost:3000/docs

### Common Issues

- **Port conflict** → Use `FIO_FETCH_PORT=8080`
- **Permission errors** → Check `~/.config/fio_fetch/` permissions
- **Build errors** → Run `docker system prune -f` and rebuild
- **Connection refused** → Verify container is running

---

## Summary

✅ **What You Get**:

- Single containerized application (frontend + backend)
- Cross-platform support (Linux, macOS, Windows)
- Data persistence via volume mapping
- Multiple deployment options (scripts, Make, Docker Compose)
- Demo data for testing
- Health checks and auto-restart
- ~255 MB optimized image

🚀 **Quick Start**:

```bash
./d10_build.sh && ./d20_run.sh
# Access at http://localhost:3000
```

📚 **Remember**:

- Data persists in `~/.config/fio_fetch/`
- Use `make help` to see all commands
- Check `docker logs fiofetch` if issues arise
- Configure via web UI at http://localhost:3000

Happy transaction fetching! 💰

---

_For questions, issues, or contributions, refer to the main project repository._

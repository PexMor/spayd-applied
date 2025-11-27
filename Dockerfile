# Multi-stage Dockerfile for fio_fetch application
# Stage 1: Build the web UI
FROM node:22-alpine AS webui-builder

# Enable Corepack and set Yarn version to 4.x
RUN corepack enable && corepack prepare yarn@4.10.3 --activate

WORKDIR /build/webui

# Copy package files and install dependencies
COPY fio_fetch_webui/package.json fio_fetch_webui/yarn.lock ./
RUN yarn install --immutable

# Copy source files and build
COPY fio_fetch_webui/ ./
RUN yarn build

# Stage 2: Build the Python backend
FROM python:3.13-slim AS backend

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Copy Python project files
COPY fio_fetch_py/pyproject.toml fio_fetch_py/uv.lock* fio_fetch_py/README.md ./
COPY fio_fetch_py/fiofetch ./fiofetch
COPY fio_fetch_py/examples ./examples

# Install Python dependencies and the package
RUN uv pip install --system -e .

# Copy built web UI from the first stage
COPY --from=webui-builder /build/webui/dist /app/static

# Create config directory
RUN mkdir -p /root/.config/fio_fetch

# Expose the default port
EXPOSE 3000

# Set environment variables
ENV FIO_FETCH_HOST=0.0.0.0
ENV FIO_FETCH_PORT=3000
ENV FIO_FETCH_DB_PATH=/root/.config/fio_fetch/fio.db
ENV FIO_FETCH_STATIC_DIR=/app/static

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Run the application
CMD ["fiofetch"]


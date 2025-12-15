#!/usr/bin/env bash
#
# d20_run.sh - Run Docker container for fio_fetch application
#
# This script runs the fio_fetch Docker container with proper volume mapping
# for configuration and database files. Works on Linux, macOS, and Windows (Git Bash/WSL).
#
# Usage:
#   ./d20_run.sh [IMAGE_NAME] [TAG] [OPTIONS]
#
# Arguments:
#   IMAGE_NAME - Name of the Docker image (default: fiofetch)
#   TAG        - Tag for the Docker image (default: latest)
#   OPTIONS    - Additional docker run options (optional)
#
# Environment Variables:
#   FIO_FETCH_TOKEN    - Fio Bank API token (optional, can be configured via web UI)
#   FIO_FETCH_PORT     - Port to expose (default: 3000)
#   FIO_FETCH_HOST     - Host to expose (default: 0.0.0.0)
#   CONTAINER_NAME     - Name for the container (default: fiofetch)
#
# Examples:
#   ./d20_run.sh                               # Runs fiofetch:latest
#   ./d20_run.sh fiofetch v1.0.0              # Runs fiofetch:v1.0.0
#   FIO_FETCH_PORT=8080 ./d20_run.sh          # Runs on port 8080
#   FIO_FETCH_TOKEN=mytoken ./d20_run.sh      # Runs with API token
#   ./d20_run.sh fiofetch latest "-e DEBUG=1" # Runs with additional options

set -e  # Exit on error
set -u  # Exit on undefined variable

# Default values
IMAGE_NAME="${1:-fiofetch}"
TAG="${2:-latest}"
ADDITIONAL_OPTIONS="${3:-}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

# Environment variable defaults
HOST_PORT="${FIO_FETCH_PORT:-3000}"
HOST_HOST="${FIO_FETCH_HOST:-0.0.0.0}"
CONTAINER_NAME="${CONTAINER_NAME:-fiofetch}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print banner
echo "========================================"
echo "  FioFetch Docker Run Script"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    print_error "Docker daemon is not running"
    exit 1
fi

# Check if image exists
if ! docker image inspect "${FULL_IMAGE_NAME}" &> /dev/null; then
    print_error "Docker image '${FULL_IMAGE_NAME}' not found"
    print_info "Build the image first using: ./d10_build.sh ${IMAGE_NAME} ${TAG}"
    exit 1
fi

# Detect operating system and set config directory
detect_os_and_config_dir() {
    local os_type
    local config_dir
    
    # Detect OS
    case "$(uname -s)" in
        Linux*)
            os_type="Linux"
            config_dir="${HOME}/.config/fio_fetch"
            ;;
        Darwin*)
            os_type="macOS"
            config_dir="${HOME}/.config/fio_fetch"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            os_type="Windows"
            # Convert Windows path to Unix-style for Docker
            if [ -n "${USERPROFILE:-}" ]; then
                # Convert C:\Users\... to /c/Users/...
                config_dir="$(echo "${USERPROFILE}" | sed 's|\\|/|g' | sed 's|^\([A-Za-z]\):|/\L\1|')/.config/fio_fetch"
            else
                config_dir="${HOME}/.config/fio_fetch"
            fi
            ;;
        *)
            os_type="Unknown"
            config_dir="${HOME}/.config/fio_fetch"
            print_warning "Unknown operating system, using default config directory"
            ;;
    esac
    
    echo "${os_type}|${config_dir}"
}

# Get OS and config directory
OS_INFO=$(detect_os_and_config_dir)
OS_TYPE=$(echo "${OS_INFO}" | cut -d'|' -f1)
CONFIG_DIR=$(echo "${OS_INFO}" | cut -d'|' -f2)

print_info "Detected OS: ${OS_TYPE}"
print_info "Config directory: ${CONFIG_DIR}"

# Create config directory if it doesn't exist
mkdir -p "${CONFIG_DIR}"

# Check if container is already running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_warning "Container '${CONTAINER_NAME}' already exists"
    
    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Container is running. Stopping it..."
        docker stop "${CONTAINER_NAME}"
    fi
    
    print_info "Removing existing container..."
    docker rm "${CONTAINER_NAME}"
fi

# Build docker run command
DOCKER_CMD="docker run -d"
DOCKER_CMD="${DOCKER_CMD} --name ${CONTAINER_NAME}"
DOCKER_CMD="${DOCKER_CMD} -p ${HOST_HOST}:${HOST_PORT}:3000"
DOCKER_CMD="${DOCKER_CMD} -v \"${CONFIG_DIR}:/root/.config/fio_fetch\""

# Add environment variables if set
if [ -n "${FIO_FETCH_TOKEN:-}" ]; then
    DOCKER_CMD="${DOCKER_CMD} -e FIO_FETCH_TOKEN=${FIO_FETCH_TOKEN}"
    print_info "Using FIO_FETCH_TOKEN from environment"
fi

# Add additional options if provided
if [ -n "${ADDITIONAL_OPTIONS}" ]; then
    DOCKER_CMD="${DOCKER_CMD} ${ADDITIONAL_OPTIONS}"
fi

# Add restart policy
DOCKER_CMD="${DOCKER_CMD} --restart unless-stopped"

# Add image name
DOCKER_CMD="${DOCKER_CMD} ${FULL_IMAGE_NAME}"

# Print configuration
print_info "Starting container with configuration:"
echo "  Image:      ${FULL_IMAGE_NAME}"
echo "  Container:  ${CONTAINER_NAME}"
echo "  Port:       ${HOST_HOST}:${HOST_PORT}:3000"
echo "  Volume:     ${CONFIG_DIR} -> /root/.config/fio_fetch"
echo ""

# Run the container
print_info "Starting container..."
CONTAINER_ID=$(eval "${DOCKER_CMD}")

# Wait a moment for container to start
sleep 2

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_success "Container started successfully!"
    echo ""
    print_info "Container ID: ${CONTAINER_ID:0:12}"
    print_info "Access the application at: http://${HOST_HOST}:${HOST_PORT}"
    echo ""
    print_info "Useful commands:"
    echo "  View logs:     docker logs -f ${CONTAINER_NAME}"
    echo "  Stop:          docker stop ${CONTAINER_NAME}"
    echo "  Start:         docker start ${CONTAINER_NAME}"
    echo "  Remove:        docker rm -f ${CONTAINER_NAME}"
    echo "  Shell access:  docker exec -it ${CONTAINER_NAME} /bin/bash"
    echo ""
    
    # Show initial logs
    print_info "Initial logs:"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -n 10
else
    print_error "Container failed to start"
    print_info "Checking logs..."
    docker logs "${CONTAINER_NAME}" 2>&1
    exit 1
fi

exit 0


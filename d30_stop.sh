#!/usr/bin/env bash
#
# d30_stop.sh - Stop and remove the FioFetch Docker container
#
# This script stops and optionally removes the FioFetch container.
#
# Usage:
#   ./d30_stop.sh [CONTAINER_NAME] [--remove]
#
# Arguments:
#   CONTAINER_NAME - Name of the container (default: fiofetch)
#   --remove       - Remove the container after stopping (default: false)
#
# Examples:
#   ./d30_stop.sh                  # Stops fiofetch container
#   ./d30_stop.sh --remove         # Stops and removes fiofetch container
#   ./d30_stop.sh mycontainer      # Stops mycontainer
#   ./d30_stop.sh mycontainer --remove  # Stops and removes mycontainer

set -e  # Exit on error
set -u  # Exit on undefined variable

# Default values
CONTAINER_NAME="${1:-fiofetch}"
REMOVE_CONTAINER=false

# Check for --remove flag
if [[ "${2:-}" == "--remove" ]] || [[ "${1:-}" == "--remove" ]]; then
    REMOVE_CONTAINER=true
    if [[ "${1}" == "--remove" ]]; then
        CONTAINER_NAME="fiofetch"
    fi
fi

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
echo "  FioFetch Docker Stop Script"
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

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_warning "Container '${CONTAINER_NAME}' does not exist"
    exit 0
fi

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Stopping container '${CONTAINER_NAME}'..."
    if docker stop "${CONTAINER_NAME}"; then
        print_success "Container stopped successfully"
    else
        print_error "Failed to stop container"
        exit 1
    fi
else
    print_info "Container '${CONTAINER_NAME}' is not running"
fi

# Remove container if requested
if [ "${REMOVE_CONTAINER}" = true ]; then
    print_info "Removing container '${CONTAINER_NAME}'..."
    if docker rm "${CONTAINER_NAME}"; then
        print_success "Container removed successfully"
    else
        print_error "Failed to remove container"
        exit 1
    fi
fi

echo ""
print_info "To start the container again, run: ./d20_run.sh"

exit 0


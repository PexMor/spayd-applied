#!/usr/bin/env bash
#
# d40_logs.sh - View logs from the FioFetch Docker container
#
# This script displays logs from the running FioFetch container.
#
# Usage:
#   ./d40_logs.sh [CONTAINER_NAME] [OPTIONS]
#
# Arguments:
#   CONTAINER_NAME - Name of the container (default: fiofetch)
#   OPTIONS        - Additional docker logs options (optional)
#
# Examples:
#   ./d40_logs.sh                    # Shows all logs
#   ./d40_logs.sh -f                 # Follow logs in real-time
#   ./d40_logs.sh --tail 50          # Show last 50 lines
#   ./d40_logs.sh mycontainer -f     # Follow logs for mycontainer
#   ./d40_logs.sh fiofetch --since 1h  # Show logs from last hour

set -e  # Exit on error
set -u  # Exit on undefined variable

# Default values
CONTAINER_NAME="fiofetch"
LOGS_OPTIONS=""

# Parse arguments
if [ $# -eq 0 ]; then
    # No arguments, use defaults
    LOGS_OPTIONS="-f"
elif [ $# -eq 1 ]; then
    # One argument - could be container name or option
    if [[ "$1" =~ ^- ]]; then
        # It's an option
        LOGS_OPTIONS="$1"
    else
        # It's a container name
        CONTAINER_NAME="$1"
        LOGS_OPTIONS="-f"
    fi
else
    # Multiple arguments
    CONTAINER_NAME="$1"
    shift
    LOGS_OPTIONS="$*"
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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
    print_error "Container '${CONTAINER_NAME}' does not exist"
    exit 1
fi

# Print banner
echo "========================================"
echo "  FioFetch Docker Logs"
echo "========================================"
print_info "Container: ${CONTAINER_NAME}"
print_info "Options: ${LOGS_OPTIONS}"
echo "========================================"
echo ""

# Show logs
docker logs ${LOGS_OPTIONS} "${CONTAINER_NAME}"

exit 0


#!/usr/bin/env bash
#
# d10_build.sh - Build Docker image for fio_fetch application
#
# This script builds a Docker image containing both the Python backend
# (fio_fetch_py) and the React frontend (fio_fetch_webui).
#
# Usage:
#   ./d10_build.sh [IMAGE_NAME] [TAG]
#
# Arguments:
#   IMAGE_NAME - Name of the Docker image (default: fiofetch)
#   TAG        - Tag for the Docker image (default: latest)
#
# Examples:
#   ./d10_build.sh                    # Builds fiofetch:latest
#   ./d10_build.sh fiofetch v1.0.0    # Builds fiofetch:v1.0.0
#   ./d10_build.sh myapp dev          # Builds myapp:dev

set -e  # Exit on error
set -u  # Exit on undefined variable

# Default values
IMAGE_NAME="${1:-fiofetch}"
TAG="${2:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

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
echo "  FioFetch Docker Build Script"
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

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found in current directory"
    exit 1
fi

# Check if required directories exist
if [ ! -d "fio_fetch_py" ]; then
    print_error "fio_fetch_py directory not found"
    exit 1
fi

if [ ! -d "fio_fetch_webui" ]; then
    print_error "fio_fetch_webui directory not found"
    exit 1
fi

print_info "Building Docker image: ${FULL_IMAGE_NAME}"
print_info "This may take several minutes..."
echo ""

# Build the Docker image
if docker build -t "${FULL_IMAGE_NAME}" . ; then
    echo ""
    print_success "Docker image built successfully: ${FULL_IMAGE_NAME}"
    echo ""
    
    # Display image information
    print_info "Image details:"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -n 2
    echo ""
    
    # Print usage instructions
    print_info "To run the container, use:"
    echo "  ./d20_run.sh ${IMAGE_NAME} ${TAG}"
    echo ""
    print_info "Or run manually with:"
    echo "  docker run -d -p 3000:3000 -v \"\$HOME/.config/fio_fetch:/root/.config/fio_fetch\" ${FULL_IMAGE_NAME}"
    echo ""
else
    echo ""
    print_error "Docker build failed"
    exit 1
fi

exit 0


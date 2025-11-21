#!/bin/bash

# Script to copy content from dist/ to docs/, replacing all existing content

# Exit on error
set -e

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define source and destination directories
SRC_DIR="$SCRIPT_DIR/dist"
DEST_DIR="$SCRIPT_DIR/docs"

# Check if source directory exists
if [ ! -d "$SRC_DIR" ]; then
    echo "Error: Source directory '$SRC_DIR' does not exist"
    exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Remove all existing content in docs/ (except hidden files like .git)
echo "Cleaning up destination directory: $DEST_DIR"
rm -rf "$DEST_DIR"/*

# Copy content from dist/ to docs/
echo "Copying content from $SRC_DIR to $DEST_DIR"
rsync -av --delete "$SRC_DIR/" "$DEST_DIR/"

echo "Successfully copied content from dist/ to docs/"

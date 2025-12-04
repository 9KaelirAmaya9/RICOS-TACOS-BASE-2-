#!/bin/bash

# Digital Ocean Container Management Script
# Wrapper for Python Digital Ocean API integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Digital Ocean Container Management Script              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$SERVICE_DIR/.env" ]; then
    echo -e "${RED}ERROR: .env file not found at $SERVICE_DIR/.env${NC}"
    echo -e "${YELLOW}Please create a .env file with:${NC}"
    echo "  DIGITALOCEAN_API_TOKEN=your_do_api_token_here"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' "$SERVICE_DIR/.env" | xargs)

# Check if API token is set
if [ -z "$DIGITALOCEAN_API_TOKEN" ]; then
    echo -e "${RED}ERROR: DIGITALOCEAN_API_TOKEN not set in .env file${NC}"
    exit 1
fi

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python3 is not installed${NC}"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "$SERVICE_DIR/venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv "$SERVICE_DIR/venv"
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
source "$SERVICE_DIR/venv/bin/activate"

# Install requirements if needed
if [ ! -f "$SERVICE_DIR/venv/.installed" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install --quiet --upgrade pip
    pip install --quiet -r "$SERVICE_DIR/requirements.txt"
    touch "$SERVICE_DIR/venv/.installed"
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Run the Python container manager
python3 "$SERVICE_DIR/container_manager.py" "$@"

# Deactivate virtual environment
deactivate

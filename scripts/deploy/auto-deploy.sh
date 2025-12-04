#!/bin/bash

# Auto-Find and Deploy Delivery Feature
# This script will automatically find your project and deploy the delivery feature

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔍 Auto-Find and Deploy Delivery Feature 🔍             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Searching for RICOS-TACOS-BASE-2- project...${NC}"

# Try to find the project directory
PROJECT_DIR=""

# Check common locations
SEARCH_PATHS=(
    "$HOME/RICOS-TACOS-BASE-2-"
    "/var/www/RICOS-TACOS-BASE-2-"
    "/opt/RICOS-TACOS-BASE-2-"
    "/root/RICOS-TACOS-BASE-2-"
    "$HOME/projects/RICOS-TACOS-BASE-2-"
    "/srv/RICOS-TACOS-BASE-2-"
)

for path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/production.docker.yml" ]; then
        PROJECT_DIR="$path"
        echo -e "${GREEN}✓ Found project at: $PROJECT_DIR${NC}"
        break
    fi
done

# If not found in common locations, search the filesystem
if [ -z "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Not found in common locations. Searching filesystem...${NC}"
    FOUND=$(find /home /var/www /opt /srv /root -name "production.docker.yml" -type f 2>/dev/null | head -1)

    if [ -n "$FOUND" ]; then
        PROJECT_DIR=$(dirname "$FOUND")
        echo -e "${GREEN}✓ Found project at: $PROJECT_DIR${NC}"
    fi
fi

# If still not found, give up
if [ -z "$PROJECT_DIR" ]; then
    echo -e "${RED}✗ Could not find RICOS-TACOS-BASE-2- project directory!${NC}"
    echo ""
    echo -e "${YELLOW}Please manually navigate to your project directory and run:${NC}"
    echo "  cd /path/to/RICOS-TACOS-BASE-2-"
    echo "  ./scripts/deploy/setup-delivery.sh"
    echo ""
    echo -e "${YELLOW}Or check if Docker containers are running:${NC}"
    echo "  docker ps"
    echo "  docker compose ls"
    exit 1
fi

echo ""
echo -e "${BLUE}Navigating to project directory...${NC}"
cd "$PROJECT_DIR"
pwd

echo ""
echo -e "${BLUE}Step 1: Pulling latest code...${NC}"
git fetch origin
git checkout claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8
git pull origin claude/fix-payment-intent-error-016Pxrq617taHBBUDx19dTp8

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to pull latest code${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Code updated${NC}"

echo ""
echo -e "${BLUE}Step 2: Updating .env file...${NC}"

# Make scripts executable
chmod +x scripts/deploy/*.sh

# Run the env update script
./scripts/deploy/update-env-delivery.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to update .env${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Deploying delivery feature...${NC}"

# Run the deployment script
./scripts/deploy/setup-delivery.sh

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          🎉 Deployment Complete! 🎉                         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Your delivery feature is now live at:${NC}"
    echo -e "${GREEN}https://138.197.35.87${NC}"
    echo ""
    echo -e "${BLUE}Test it by adding items to cart and selecting 'Delivery' at checkout${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo -e "${YELLOW}Check the logs above for details${NC}"
    exit 1
fi

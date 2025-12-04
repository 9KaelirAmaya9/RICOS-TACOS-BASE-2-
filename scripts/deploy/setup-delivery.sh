#!/bin/bash

# Delivery Setup Script
# Run this on your production server to deploy the delivery feature

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🚗 Delivery Feature Deployment Script 🚗           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Auto-detect script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}Project directory: ${PROJECT_ROOT}${NC}"
cd "$PROJECT_ROOT"

# Verify we're in the right place
if [ ! -f "production.docker.yml" ]; then
    echo -e "${RED}ERROR: production.docker.yml not found!${NC}"
    echo -e "${YELLOW}This script must be run from the project root or using ./scripts/deploy/setup-delivery.sh${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please make sure your .env file has the following variables:${NC}"
    echo "  - GOOGLE_MAPS_API_KEY"
    echo "  - REACT_APP_GOOGLE_MAPS_API_KEY"
    echo "  - RESTAURANT_LAT"
    echo "  - RESTAURANT_LNG"
    echo "  - RESTAURANT_ADDRESS"
    echo "  - DELIVERY_MAX_DISTANCE"
    echo "  - DELIVERY_BASE_FEE"
    echo "  - DELIVERY_PER_MILE_FEE"
    echo "  - FREE_DELIVERY_MINIMUM"
    exit 1
fi

# Check if Google Maps API key is configured
if ! grep -q "GOOGLE_MAPS_API_KEY=AIzaSy" .env 2>/dev/null; then
    echo -e "${RED}ERROR: Google Maps API key not configured in .env file!${NC}"
    echo -e "${YELLOW}Please add your Google Maps API key to .env:${NC}"
    echo "  GOOGLE_MAPS_API_KEY=your_api_key_here"
    echo "  REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here"
    exit 1
fi

# Load environment variables from .env file (handle inline comments and spaces)
set -a
source <(grep -v '^#' .env | sed 's/#.*//' | grep -v '^[[:space:]]*$')
set +a

# Detect docker-compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo -e "${RED}ERROR: docker-compose or docker compose not found!${NC}"
    exit 1
fi

# Get database credentials from environment
DB_USER="${POSTGRES_USER:-myuser}"
DB_NAME="${POSTGRES_DB:-mydatabase}"

echo -e "${BLUE}Using database: ${DB_NAME} with user: ${DB_USER}${NC}"

echo -e "${BLUE}Step 1/4: Applying database migration...${NC}"
# Apply the delivery fields migration
$DOCKER_COMPOSE -f production.docker.yml exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < services/backend/database/migrations/20251203_add_delivery_fields.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database migration applied successfully${NC}"
else
    echo -e "${RED}✗ Database migration failed${NC}"
    echo -e "${YELLOW}This might be normal if the migration was already applied.${NC}"
fi

echo ""
echo -e "${BLUE}Step 2/4: Rebuilding containers with new environment variables...${NC}"
$DOCKER_COMPOSE -f production.docker.yml build

echo ""
echo -e "${BLUE}Step 3/4: Restarting services...${NC}"
$DOCKER_COMPOSE -f production.docker.yml down
$DOCKER_COMPOSE -f production.docker.yml up -d

echo ""
echo -e "${BLUE}Step 4/4: Waiting for services to be healthy...${NC}"
sleep 10

# Check container status
echo ""
$DOCKER_COMPOSE -f production.docker.yml ps

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       🎉 Delivery Feature Deployed Successfully! 🎉         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Your delivery system is now configured with:${NC}"
echo -e "  📍 Restaurant: 501 51st St, Brooklyn, NY 11220"
echo -e "  🚗 Delivery radius: 10 miles"
echo -e "  💵 Base fee: \$3.99"
echo -e "  📏 Per mile fee: \$0.50"
echo -e "  🎁 Free delivery on orders over: \$50.00"
echo ""
echo -e "${BLUE}Test the delivery feature by:${NC}"
echo -e "  1. Going to your site and adding items to cart"
echo -e "  2. Clicking 'Proceed to Checkout'"
echo -e "  3. Toggle to 'Delivery' and enter an address"
echo -e "  4. The system will validate the address and calculate the delivery fee"
echo ""
echo -e "${YELLOW}Note: Make sure your Google Maps API has the following APIs enabled:${NC}"
echo -e "  • Maps JavaScript API (for frontend autocomplete)"
echo -e "  • Geocoding API (for backend address validation)"
echo ""

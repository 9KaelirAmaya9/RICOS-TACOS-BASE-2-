#!/bin/bash

# Update .env with Delivery Configuration
# Run this on your server to add delivery settings to your .env file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Auto-detect script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Update .env with Delivery Configuration             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Project directory: ${PROJECT_ROOT}${NC}"
cd "$PROJECT_ROOT"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file first (you can copy from .env.example)${NC}"
    exit 1
fi

# Backup .env
echo -e "${BLUE}Creating backup of .env file...${NC}"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

# Function to update or add env variable
update_env() {
    local key=$1
    local value=$2
    local file=".env"

    if grep -q "^${key}=" "$file"; then
        # Update existing
        sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
    fi
}

echo -e "${BLUE}Adding/updating delivery configuration...${NC}"

# Check if delivery config section exists
if ! grep -q "# Google Maps Configuration" .env; then
    # Add the entire delivery configuration section
    cat >> .env << 'EOF'

# ============================================
# Google Maps Configuration
# ============================================
GOOGLE_MAPS_API_KEY=AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw

# ============================================
# Restaurant Location Configuration
# ============================================
RESTAURANT_ADDRESS=501 51st St, Brooklyn, NY 11220
RESTAURANT_LAT=40.6508
RESTAURANT_LNG=-74.0133

# ============================================
# Delivery Configuration
# ============================================
DELIVERY_MAX_DISTANCE=10          # Maximum delivery radius in miles
DELIVERY_BASE_FEE=3.99            # Base delivery fee
DELIVERY_PER_MILE_FEE=0.50        # Additional fee per mile
FREE_DELIVERY_MINIMUM=50.00       # Free delivery for orders above this amount
EOF
    echo -e "${GREEN}✓ Delivery configuration added${NC}"
else
    echo -e "${YELLOW}Delivery configuration already exists in .env${NC}"
    echo -e "${YELLOW}Updating individual values...${NC}"

    update_env "GOOGLE_MAPS_API_KEY" "AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw"
    update_env "REACT_APP_GOOGLE_MAPS_API_KEY" "AIzaSyAPv0cP36FDK2hg7F_mn-Lr5yatA3bpEuw"
    update_env "RESTAURANT_ADDRESS" "501 51st St, Brooklyn, NY 11220"
    update_env "RESTAURANT_LAT" "40.6508"
    update_env "RESTAURANT_LNG" "-74.0133"
    update_env "DELIVERY_MAX_DISTANCE" "10"
    update_env "DELIVERY_BASE_FEE" "3.99"
    update_env "DELIVERY_PER_MILE_FEE" "0.50"
    update_env "FREE_DELIVERY_MINIMUM" "50.00"

    echo -e "${GREEN}✓ Values updated${NC}"
fi

# Update FRONTEND_URL if it's still localhost
if grep -q "FRONTEND_URL=http://localhost" .env; then
    echo ""
    echo -e "${YELLOW}Updating FRONTEND_URL to production server...${NC}"
    update_env "FRONTEND_URL" "https://138.197.35.87"
    echo -e "${GREEN}✓ FRONTEND_URL updated to https://138.197.35.87${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ .env Updated Successfully! ✓                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Configuration added:${NC}"
echo -e "  📍 Restaurant: 501 51st St, Brooklyn, NY 11220"
echo -e "  🗺️  Google Maps API: Configured"
echo -e "  🚗 Delivery radius: 10 miles"
echo -e "  💵 Base fee: \$3.99 + \$0.50/mile"
echo -e "  🎁 Free delivery over: \$50"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Run: ${GREEN}./scripts/deploy/setup-delivery.sh${NC}"
echo -e "  2. This will apply database migrations and restart services"
echo ""

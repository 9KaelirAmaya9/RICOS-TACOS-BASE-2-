#!/bin/bash

# ==============================================================================
# Update Stripe Keys on Deployed Server
# ==============================================================================
# This script updates Stripe API keys in the deployed environment
# Usage: ./update-stripe-keys.sh <stripe_secret_key> <stripe_publishable_key>
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <stripe_secret_key> <stripe_publishable_key>"
    echo ""
    echo "Example:"
    echo "  $0 sk_test_your_secret_key pk_test_your_publishable_key"
    echo ""
    echo "To get your Stripe keys:"
    echo "  1. Go to https://dashboard.stripe.com/test/apikeys"
    echo "  2. Copy the 'Secret key' and 'Publishable key'"
    echo ""
    exit 1
fi

STRIPE_SECRET_KEY=$1
STRIPE_PUBLISHABLE_KEY=$2

# Validate key formats
if [[ ! $STRIPE_SECRET_KEY =~ ^sk_(test|live)_ ]]; then
    echo -e "${RED}Error: Invalid Stripe secret key format${NC}"
    echo "Secret key should start with 'sk_test_' or 'sk_live_'"
    exit 1
fi

if [[ ! $STRIPE_PUBLISHABLE_KEY =~ ^pk_(test|live)_ ]]; then
    echo -e "${RED}Error: Invalid Stripe publishable key format${NC}"
    echo "Publishable key should start with 'pk_test_' or 'pk_live_'"
    exit 1
fi

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Updating Stripe Keys${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo -e "${RED}Error: .env.example not found!${NC}"
        exit 1
    fi
fi

# Backup current .env
echo -e "${YELLOW}Creating backup of current .env...${NC}"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update Stripe keys in .env
echo -e "${BLUE}Updating Stripe keys in .env...${NC}"

# Update STRIPE_SECRET_KEY
if grep -q "^STRIPE_SECRET_KEY=" .env; then
    sed -i "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY|" .env
else
    echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> .env
fi

# Update REACT_APP_STRIPE_PUBLISHABLE_KEY
if grep -q "^REACT_APP_STRIPE_PUBLISHABLE_KEY=" .env; then
    sed -i "s|^REACT_APP_STRIPE_PUBLISHABLE_KEY=.*|REACT_APP_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY|" .env
else
    echo "REACT_APP_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY" >> .env
fi

echo -e "${GREEN}✓ Stripe keys updated in .env${NC}"
echo ""

# Restart containers
echo -e "${BLUE}Restarting containers to apply changes...${NC}"
echo ""

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Restart the containers
$DOCKER_COMPOSE -f production.docker.yml up -d --force-recreate --no-deps backend react-app

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  ✓ Stripe keys updated successfully!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo -e "${BLUE}Containers are restarting with new keys...${NC}"
echo -e "${BLUE}Check status with: $DOCKER_COMPOSE -f production.docker.yml ps${NC}"
echo ""
echo -e "${YELLOW}Note: It may take 30-60 seconds for services to be fully ready.${NC}"

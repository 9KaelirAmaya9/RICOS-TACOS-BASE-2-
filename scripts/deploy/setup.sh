#!/bin/bash

# ==============================================================================
# Base2 Deployment Setup Script
# ==============================================================================
# This script sets up the environment and starts the application.
# Usage: ./setup.sh [--non-interactive]
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

NON_INTERACTIVE=false

# Parse args
for arg in "$@"
do
    case $arg in
        --non-interactive)
        NON_INTERACTIVE=true
        shift
        ;;
    esac
done

echo -e "${BLUE}Starting Base2 Deployment Setup...${NC}"

# 1. Check for .env file
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo -e "${RED}Error: .env.example not found!${NC}"
        exit 1
    fi
    
    # In non-interactive mode, we assume .env.example has sane defaults or secrets are injected another way.
    # For a real production setup, you might want to pull secrets from a vault here.

    if [ "$NON_INTERACTIVE" = false ]; then
        echo -e "${BLUE}Please configure your .env file now.${NC}"
        read -p "Press Enter to continue after editing .env..."
    else
        echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                    ⚠️  WARNING  ⚠️                          ║${NC}"
        echo -e "${RED}╠══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${RED}║  Using default .env values with PLACEHOLDER credentials!    ║${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}║  🔐 CRITICAL: You MUST update these secrets:                ║${NC}"
        echo -e "${RED}║  - STRIPE_SECRET_KEY                                         ║${NC}"
        echo -e "${RED}║  - REACT_APP_STRIPE_PUBLISHABLE_KEY                          ║${NC}"
        echo -e "${RED}║  - JWT_SECRET                                                ║${NC}"
        echo -e "${RED}║  - Database passwords                                        ║${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}║  💳 To fix Stripe configuration:                            ║${NC}"
        echo -e "${RED}║  1. Get your keys from:                                      ║${NC}"
        echo -e "${RED}║     https://dashboard.stripe.com/test/apikeys               ║${NC}"
        echo -e "${RED}║  2. Run:                                                     ║${NC}"
        echo -e "${RED}║     ./scripts/deploy/update-stripe-keys.sh \\                ║${NC}"
        echo -e "${RED}║       sk_test_YOUR_KEY pk_test_YOUR_KEY                     ║${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}║  ⚠️  Payments will NOT work until Stripe keys are set!      ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
    fi
fi

# 2. Create necessary directories
echo -e "${BLUE}Creating directory structure...${NC}"
mkdir -p services/backend/logs
mkdir -p services/nginx/certs

# 3. Generate Self-Signed Certs if missing (for Nginx)
if [ ! -f services/nginx/certs/selfsigned.key ]; then
    echo -e "${BLUE}Generating self-signed SSL certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout services/nginx/certs/selfsigned.key \
        -out services/nginx/certs/selfsigned.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# 4. Build and Start Containers
echo -e "${GREEN}Building and starting containers...${NC}"

# Check if docker-compose or docker compose is available
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

$DOCKER_COMPOSE -f production.docker.yml build
$DOCKER_COMPOSE -f production.docker.yml up -d

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 Deployment Complete! 🎉                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Check status with:${NC}"
echo -e "  $DOCKER_COMPOSE -f production.docker.yml ps"
echo ""
echo -e "${BLUE}View logs with:${NC}"
echo -e "  $DOCKER_COMPOSE -f production.docker.yml logs -f"
echo ""

# Check if Stripe keys are still placeholders
if grep -q "STRIPE_SECRET_KEY=sk_test_placeholder" .env 2>/dev/null || \
   grep -q "STRIPE_SECRET_KEY=$" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  REMINDER: Stripe keys are not configured!${NC}"
    echo -e "${YELLOW}   Payment functionality will not work until you update them.${NC}"
    echo -e ""
    echo -e "${BLUE}   To configure Stripe:${NC}"
    echo -e "   ./scripts/deploy/update-stripe-keys.sh sk_test_YOUR_KEY pk_test_YOUR_KEY"
    echo ""
fi

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
        echo -e "${BLUE}Using default .env values. PLEASE UPDATE SECRETS LATER.${NC}"
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

echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}Check status with: $DOCKER_COMPOSE -f production.docker.yml ps${NC}"

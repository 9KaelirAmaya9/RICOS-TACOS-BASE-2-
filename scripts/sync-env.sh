#!/bin/bash
# Synchronize literal configuration values with .env variables
# This script updates literal keys in YAML files to match .env values

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Synchronizing configuration with .env variables...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo "❌ Error: No .env or .env.example found"
        exit 1
    fi
fi

# Load .env file
echo "📖 Loading environment variables..."
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
        continue
    fi
    # Remove inline comments (be careful not to remove # inside quotes if possible, but simple sed is what was there)
    # The original script used sed 's/ *#.*//' which removes everything after a space followed by #
    clean_line=$(echo "$line" | sed 's/ *#.*//')
    
    # Skip if empty after cleaning
    if [[ -z "$clean_line" ]]; then
        continue
    fi
    
    # Export the variable safely
    export "$clean_line"
done < .env

# Validate required variables
if [ -z "$NETWORK_NAME" ]; then
    echo "❌ Error: NETWORK_NAME not set in .env"
    exit 1
fi

if [ -z "$TRAEFIK_API_ENTRYPOINT" ]; then
    echo "❌ Error: TRAEFIK_API_ENTRYPOINT not set in .env"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

CHANGES_MADE=false

# ============================================
# 1. Sync TRAEFIK_DOCKER_NETWORK with NETWORK_NAME in .env
# ============================================
echo "🔍 Checking .env consistency..."
CURRENT_TRAEFIK_NETWORK=$(grep "^TRAEFIK_DOCKER_NETWORK=" .env | cut -d'=' -f2)

if [ "$CURRENT_TRAEFIK_NETWORK" != "$NETWORK_NAME" ]; then
    echo -e "${YELLOW}⚙️  Syncing TRAEFIK_DOCKER_NETWORK: $CURRENT_TRAEFIK_NETWORK → $NETWORK_NAME${NC}"
    
    # macOS compatible sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^TRAEFIK_DOCKER_NETWORK=.*/TRAEFIK_DOCKER_NETWORK=$NETWORK_NAME/" .env
    else
        sed -i "s/^TRAEFIK_DOCKER_NETWORK=.*/TRAEFIK_DOCKER_NETWORK=$NETWORK_NAME/" .env
    fi
    
    echo -e "${GREEN}✅ Updated .env${NC}"
    CHANGES_MADE=true
else
    echo "✓ .env is consistent"
fi
echo ""

# ============================================
# 2. Update local.docker.yml network references
# ============================================
echo "🔍 Checking local.docker.yml network configuration..."

# Detect current network key in networks definition
CURRENT_NETWORK=$(grep -A 1 "^networks:" local.docker.yml | tail -1 | sed 's/^[[:space:]]*//' | sed 's/:.*$//')

if [ "$CURRENT_NETWORK" != "$NETWORK_NAME" ]; then
    echo -e "${YELLOW}⚙️  Updating network configuration: $CURRENT_NETWORK → $NETWORK_NAME${NC}"
    
    # Create backup
    cp local.docker.yml local.docker.yml.bak
    
    # Update network definition key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^  $CURRENT_NETWORK:/  $NETWORK_NAME:/" local.docker.yml
        # Update all service network references
        sed -i '' "s/- $CURRENT_NETWORK\$/- $NETWORK_NAME/" local.docker.yml
    else
        sed -i "s/^  $CURRENT_NETWORK:/  $NETWORK_NAME:/" local.docker.yml
        # Update all service network references
        sed -i "s/- $CURRENT_NETWORK\$/- $NETWORK_NAME/" local.docker.yml
    fi
    
    echo -e "${GREEN}✅ Updated local.docker.yml${NC}"
    echo "   - Network definition key: $CURRENT_NETWORK → $NETWORK_NAME"
    echo "   - All service network references updated"
    CHANGES_MADE=true
    
    rm -f local.docker.yml.bak
else
    echo "✓ local.docker.yml network is correct"
fi
echo ""

# ============================================
# 3. Update traefik.yml entrypoint key
# ============================================
echo "🔍 Checking services/traefik/traefik.yml entrypoint configuration..."

# Detect current API entrypoint key (exclude 'web' entrypoint)
CURRENT_ENTRYPOINT=$(grep -A 10 "^entryPoints:" services/traefik/traefik.yml | grep -E "^  [a-z]" | grep -v "web:" | head -1 | sed 's/:.*$//' | sed 's/^[[:space:]]*//')

if [ "$CURRENT_ENTRYPOINT" != "$TRAEFIK_API_ENTRYPOINT" ]; then
    echo -e "${YELLOW}⚙️  Updating API entrypoint: $CURRENT_ENTRYPOINT → $TRAEFIK_API_ENTRYPOINT${NC}"
    
    # Create backup
    cp services/traefik/traefik.yml services/traefik/traefik.yml.bak
    
    # Update entrypoint definition key (must preserve indentation)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^  $CURRENT_ENTRYPOINT:/  $TRAEFIK_API_ENTRYPOINT:/" services/traefik/traefik.yml
    else
        sed -i "s/^  $CURRENT_ENTRYPOINT:/  $TRAEFIK_API_ENTRYPOINT:/" services/traefik/traefik.yml
    fi
    
    echo -e "${GREEN}✅ Updated services/traefik/traefik.yml${NC}"
    echo "   - API entrypoint key: $CURRENT_ENTRYPOINT → $TRAEFIK_API_ENTRYPOINT"
    CHANGES_MADE=true
    
    rm -f services/traefik/traefik.yml.bak
else
    echo "✓ services/traefik/traefik.yml entrypoint is correct"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$CHANGES_MADE" = true ]; then
    echo -e "${GREEN}🎉 Synchronization complete! Changes were made.${NC}"
    echo ""
    echo "Current configuration:"
    echo "  - Network Name: $NETWORK_NAME"
    echo "  - API Entrypoint: $TRAEFIK_API_ENTRYPOINT"
    echo ""
    echo "💡 You should rebuild your containers for changes to take effect:"
    echo "   ./scripts/stop.sh && ./scripts/start.sh --build"
else
    echo -e "${GREEN}✅ All configuration is already synchronized!${NC}"
    echo ""
    echo "Current configuration:"
    echo "  - Network Name: $NETWORK_NAME"
    echo "  - API Entrypoint: $TRAEFIK_API_ENTRYPOINT"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

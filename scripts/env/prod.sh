#!/bin/bash
# Production Environment Management Script
# Usage: ./scripts/env/prod.sh [start|stop|build|restart|logs]

set -e

COMPOSE_FILE="production.docker.yml"
PROJECT_NAME="base2_prod"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

command=$1
shift

case $command in
    start)
        echo -e "${GREEN}Starting PRODUCTION environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d "$@"
        ;;
    stop)
        echo -e "${BLUE}Stopping PRODUCTION environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down "$@"
        ;;
    build)
        echo -e "${BLUE}Building PRODUCTION environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build "$@"
        ;;
    restart)
        echo -e "${BLUE}Restarting PRODUCTION environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart "$@"
        ;;
    logs)
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f "$@"
        ;;
    *)
        echo "Usage: ./scripts/env/prod.sh [start|stop|build|restart|logs]"
        exit 1
        ;;
esac

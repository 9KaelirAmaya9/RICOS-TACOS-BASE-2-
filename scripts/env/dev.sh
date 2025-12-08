#!/bin/bash
# Development Production (Staging) Environment Management Script
# Usage: ./scripts/env/dev.sh [start|stop|build|restart|logs]

set -e

COMPOSE_FILE="dev.docker.yml"
PROJECT_NAME="base2_dev"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

command=$1
shift

case $command in
    start)
        echo -e "${GREEN}Starting DEV (Staging) environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d "$@"
        ;;
    stop)
        echo -e "${BLUE}Stopping DEV (Staging) environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down "$@"
        ;;
    build)
        echo -e "${BLUE}Building DEV (Staging) environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build "$@"
        ;;
    restart)
        echo -e "${BLUE}Restarting DEV (Staging) environment...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart "$@"
        ;;
    logs)
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f "$@"
        ;;
    *)
        echo "Usage: ./scripts/env/dev.sh [start|stop|build|restart|logs]"
        exit 1
        ;;
esac

#!/bin/bash

# Database Backup Script
# Creates a compressed PostgreSQL dump with timestamp and rotation

set -e

# Load environment variables
if [ -f .env ]; then
    set -a
    source <(grep -v '^#' .env | grep -v '^$')
    set +a
fi

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
RETENTION_DAYS=7

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
if ! docker ps | grep -q base2_postgres; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    echo "Start it with: docker-compose -f production.docker.yml up -d postgres"
    exit 1
fi

# Create backup using pg_dump via Docker
echo -e "${YELLOW}Creating database dump...${NC}"
docker exec base2_postgres pg_dump -U ${POSTGRES_USER:-myuser} ${POSTGRES_DB:-mydatabase} > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database dump created: $BACKUP_FILE${NC}"
    
    # Compress the backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup compressed: $COMPRESSED_FILE${NC}"
        
        # Get file size
        SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo -e "${GREEN}✓ Backup size: $SIZE${NC}"
    else
        echo -e "${RED}Error: Failed to compress backup${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Failed to create database dump${NC}"
    exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
echo -e "${YELLOW}Cleaning up old backups (keeping last ${RETENTION_DAYS} days)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Total backups: $BACKUP_COUNT${NC}"

echo -e "${GREEN}✓ Backup completed successfully!${NC}"
echo -e "${GREEN}Backup location: $COMPRESSED_FILE${NC}"

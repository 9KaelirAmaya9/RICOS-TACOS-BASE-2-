#!/bin/bash

# Database Restore Script
# Restores PostgreSQL database from a compressed backup

set -e

# Load environment variables
if [ -f .env ]; then
    set -a
    source <(grep -v '^#' .env | grep -v '^$')
    set +a
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: ./restore-database.sh <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q base2_postgres; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    echo "Start it with: docker-compose -f production.docker.yml up -d postgres"
    exit 1
fi

# Warning prompt
echo -e "${YELLOW}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo -e "${YELLOW}Database: ${POSTGRES_DB:-mydatabase}${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Decompress backup if it's gzipped
TEMP_FILE="/tmp/restore_temp.sql"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# Drop existing database and recreate
echo -e "${YELLOW}Dropping existing database...${NC}"
docker exec base2_postgres psql -U ${POSTGRES_USER:-myuser} -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-mydatabase};"

echo -e "${YELLOW}Creating new database...${NC}"
docker exec base2_postgres psql -U ${POSTGRES_USER:-myuser} -c "CREATE DATABASE ${POSTGRES_DB:-mydatabase};"

# Restore from backup
echo -e "${YELLOW}Restoring database from backup...${NC}"
docker exec -i base2_postgres psql -U ${POSTGRES_USER:-myuser} ${POSTGRES_DB:-mydatabase} < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    rm "$TEMP_FILE"
else
    echo -e "${RED}Error: Failed to restore database${NC}"
    rm "$TEMP_FILE"
    exit 1
fi

echo -e "${GREEN}✓ Restore completed!${NC}"

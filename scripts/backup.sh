#!/bin/bash

# MediFlow Backup Script
# This script backs up MongoDB data

set -e

echo "======================================"
echo "MediFlow Backup Script"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/mongodb-backup-$DATE"

mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Creating MongoDB backup...${NC}"
echo "Backup location: $BACKUP_PATH"
echo ""

# Check if MongoDB container is running
if ! docker ps | grep -q mediflow-mongodb; then
    echo -e "${RED}Error: MongoDB container is not running!${NC}"
    echo "Start it with: docker-compose up -d mongodb"
    exit 1
fi

# Create backup
docker exec mediflow-mongodb mongodump \
    --out /data/backup \
    -u ${MONGO_USERNAME} \
    -p ${MONGO_PASSWORD} \
    --authenticationDatabase admin

# Copy backup from container to host
docker cp mediflow-mongodb:/data/backup $BACKUP_PATH

echo -e "${GREEN}✓ Backup created successfully!${NC}"
echo ""
echo "Backup location: $BACKUP_PATH"
echo ""

# Show backup size
BACKUP_SIZE=$(du -sh $BACKUP_PATH | cut -f1)
echo "Backup size: $BACKUP_SIZE"
echo ""

# List all backups
echo "All backups:"
ls -lh $BACKUP_DIR
echo ""

# Keep only last 7 backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR | wc -l)
if [ $BACKUP_COUNT -gt 7 ]; then
    echo "Cleaning old backups (keeping last 7)..."
    ls -t $BACKUP_DIR | tail -n +8 | xargs -I {} rm -rf $BACKUP_DIR/{}
    echo -e "${GREEN}✓ Old backups cleaned${NC}"
fi

echo ""
echo "To restore this backup, run:"
echo "  docker exec -i mediflow-mongodb mongorestore --drop /data/backup -u ${MONGO_USERNAME} -p ${MONGO_PASSWORD} --authenticationDatabase admin"
echo ""

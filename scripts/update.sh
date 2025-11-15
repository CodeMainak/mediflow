#!/bin/bash

# MediFlow Update Script
# Use this script to update your application after code changes

set -e

echo "======================================"
echo "MediFlow Update Script"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Pulling latest code (if using git)...${NC}"
if [ -d .git ]; then
    git pull
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo "Not a git repository, skipping..."
fi
echo ""

echo -e "${YELLOW}Step 2: Rebuilding containers...${NC}"
docker-compose build
echo -e "${GREEN}✓ Rebuild complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Restarting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

echo -e "${YELLOW}Step 4: Checking service health...${NC}"
sleep 5
docker-compose ps
echo ""

echo -e "${GREEN}Update complete! ✓${NC}"
echo ""
echo "To view logs, run:"
echo "  docker-compose logs -f"
echo ""

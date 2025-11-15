#!/bin/bash

# MediFlow Deployment Script
# This script builds and deploys the application using Docker Compose

set -e  # Exit on error

echo "======================================"
echo "MediFlow Deployment Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Stopping existing containers (if any)...${NC}"
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building Docker images...${NC}"
echo "This may take 5-10 minutes on first run..."
docker-compose build
echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

echo -e "${YELLOW}Step 4: Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Services started${NC}"
echo ""

echo -e "${YELLOW}Step 5: Waiting for services to be healthy...${NC}"
sleep 10

# Check if containers are running
echo "Checking container status..."
docker-compose ps

echo ""
echo -e "${GREEN}======================================"
echo "Deployment Complete! 🎉"
echo "======================================${NC}"
echo ""
echo "Your application is now running:"
echo ""
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8000"
echo "  API:      http://localhost:8000/api"
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
echo ""
echo "To view real-time logs, run:"
echo "  docker-compose logs -f"
echo ""

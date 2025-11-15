#!/bin/bash

# MediFlow Status Checker
# Check the health and status of all services

echo "======================================"
echo "MediFlow Status Dashboard"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Container Status:${NC}"
docker-compose ps
echo ""

echo -e "${BLUE}Container Health:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep mediflow
echo ""

echo -e "${BLUE}Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep mediflow
echo ""

echo -e "${BLUE}Disk Usage:${NC}"
echo "Docker images:"
docker images | grep mediflow
echo ""
echo "Docker volumes:"
docker volume ls | grep mediflow
echo ""

echo -e "${BLUE}Network Status:${NC}"
docker network ls | grep mediflow
echo ""

echo -e "${BLUE}Quick Health Check:${NC}"

# Check if services are responding
if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "Backend API: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Backend API: ${RED}✗ Not responding${NC}"
fi

if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo -e "Frontend: ${GREEN}✓ Healthy${NC}"
else
    echo -e "Frontend: ${RED}✗ Not responding${NC}"
fi

if docker exec mediflow-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "MongoDB: ${GREEN}✓ Healthy${NC}"
else
    echo -e "MongoDB: ${RED}✗ Not responding${NC}"
fi

echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8000"
echo "  API:      http://localhost:8000/api"
echo ""

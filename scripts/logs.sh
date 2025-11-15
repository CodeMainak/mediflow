#!/bin/bash

# MediFlow Logs Viewer
# Quick access to service logs

if [ -z "$1" ]; then
    echo "Usage: ./logs.sh [service]"
    echo ""
    echo "Available services:"
    echo "  all       - All services"
    echo "  backend   - Backend API logs"
    echo "  frontend  - Frontend/Nginx logs"
    echo "  mongodb   - Database logs"
    echo ""
    echo "Example: ./logs.sh backend"
    exit 1
fi

case $1 in
    all)
        docker-compose logs -f
        ;;
    backend)
        docker-compose logs -f backend
        ;;
    frontend)
        docker-compose logs -f frontend
        ;;
    mongodb)
        docker-compose logs -f mongodb
        ;;
    *)
        echo "Unknown service: $1"
        echo "Available: all, backend, frontend, mongodb"
        exit 1
        ;;
esac

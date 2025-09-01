#!/bin/bash

# Start ChromaDB server for Counsel Framework
# This script starts a ChromaDB server using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CHROMADB_PORT=${CHROMADB_PORT:-8444}
CHROMADB_DATA_DIR=${CHROMADB_DATA_DIR:-~/.counsel/chromadb}

echo -e "${GREEN}Starting ChromaDB server for Counsel Framework...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p "$CHROMADB_DATA_DIR"
echo -e "${GREEN}Data directory: $CHROMADB_DATA_DIR${NC}"

# Check if ChromaDB is already running
if docker ps | grep -q "chromadb/chroma"; then
    echo -e "${YELLOW}ChromaDB is already running${NC}"
    echo "To stop it: docker stop chromadb"
    echo "To restart: docker restart chromadb"
else
    # Start ChromaDB container
    echo -e "${GREEN}Starting ChromaDB container...${NC}"
    docker run -d \
        --name chromadb \
        -p ${CHROMADB_PORT}:8000 \
        -v ${CHROMADB_DATA_DIR}:/chroma/chroma \
        -e ANONYMIZED_TELEMETRY=false \
        -e ALLOW_RESET=true \
        --restart unless-stopped \
        chromadb/chroma:latest

    echo -e "${GREEN}ChromaDB started successfully!${NC}"
fi

# Wait for ChromaDB to be ready
echo -e "${GREEN}Waiting for ChromaDB to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:${CHROMADB_PORT}/api/v1 > /dev/null 2>&1; then
        echo -e "${GREEN}ChromaDB is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}ChromaDB failed to start. Check Docker logs:${NC}"
        echo "docker logs chromadb"
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}ChromaDB is running at: http://localhost:${CHROMADB_PORT}${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs chromadb"
echo "  Stop server:  docker stop chromadb"
echo "  Restart:      docker restart chromadb"
echo "  Remove:       docker rm chromadb"
echo ""
echo "Index your counsel work:"
echo "  counsel index --all"
echo ""
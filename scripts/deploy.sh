#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment...${NC}"

# Change to deployment directory
cd /opt/job-platform

# Load environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
    echo -e "${GREEN}Environment variables loaded${NC}"
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Create backup of current state
echo -e "${YELLOW}Creating backup...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml ps > /tmp/docker_state_$BACKUP_DATE.txt

# Deploy new containers
echo -e "${YELLOW}Deploying new containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 15

# Health check for backend
echo -e "${YELLOW}Running health checks...${NC}"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}Backend health check passed!${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo -e "${RED}Backend health check failed after $MAX_RETRIES attempts${NC}"
            echo -e "${YELLOW}Rolling back...${NC}"
            docker-compose -f docker-compose.prod.yml logs backend
            exit 1
        fi
        echo -e "${YELLOW}Retry $RETRY_COUNT/$MAX_RETRIES...${NC}"
        sleep 5
    fi
done

# Health check for frontend
if curl -sf http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}Frontend health check passed!${NC}"
else
    echo -e "${YELLOW}Frontend may still be starting...${NC}"
fi

# Cleanup old images
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

# Show running containers
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Running containers:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}Services available at:${NC}"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8080"
echo "  - Backend Health: http://localhost:8080/health"

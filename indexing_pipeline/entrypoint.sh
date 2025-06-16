#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Prefect ETL Pipeline Container...${NC}"

# Start Prefect server in the background
echo -e "${YELLOW}Starting Prefect server...${NC}"
uv run prefect server start --host 0.0.0.0 --port 4200 &

# Wait for server to be ready
echo -e "${YELLOW}Waiting for Prefect server to be ready...${NC}"
until curl -f http://localhost:4200/api/health > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for Prefect server...${NC}"
    sleep 2
done

echo -e "${GREEN}✅ Prefect server is ready!${NC}"
echo -e "${GREEN}🌐 UI available at: http://localhost:4200${NC}"
echo -e "${BLUE}📁 Your code is mounted at: /app/src${NC}"
echo -e "${BLUE}📊 Data directory: /app/data${NC}"

# Handle different run modes
if [ "$1" = "dev" ]; then
    echo -e "${GREEN}🔧 Running in development mode - container will stay alive${NC}"
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo -e "  - Edit code in src/ directory for live updates"
    echo -e "  - Run pipeline: docker-compose exec prefect uv run python -m indexing_pipeline.main"
    echo -e "  - View logs: docker-compose logs -f prefect"
    echo -e "  - Open shell: docker-compose exec prefect bash"

    # Keep container running
    tail -f /dev/null

elif [ "$1" = "pipeline" ]; then
    echo -e "${GREEN}🚀 Running ETL pipeline...${NC}"
    uv run python -m indexing_pipeline.main

elif [ "$1" = "shell" ]; then
    echo -e "${GREEN}🐚 Opening interactive shell...${NC}"
    exec bash

else
    # Run custom command
    echo -e "${GREEN}🎯 Running custom command: $@${NC}"
    exec "$@"
fi

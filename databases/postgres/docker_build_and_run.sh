#!/bin/bash

# Stop and remove existing container if it exists
docker stop postgres-db 2>/dev/null || true
docker rm postgres-db 2>/dev/null || true

# Build the Docker image
echo "Building PostgreSQL Docker image..."
docker build -t postgres-db .

# Run the container
echo "Starting PostgreSQL container..."
docker run -d \
    --name postgres-db \
    -p 5432:5432 \
    postgres-db

echo "PostgreSQL container is running!"
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Password: password123"
echo "  Database: postgres"

echo " run this command to connect to the database: psql -h localhost -p 5432 -U postgres"
#!/bin/bash
set -e
set -x

# Build and start the containers
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

# Optional: Clean up old images
docker image prune -f

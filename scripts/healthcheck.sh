#!/bin/bash
# Simple health check for PocketBase service
# Expects POCKETBASE_URL env var or defaults to http://localhost:8091/api/health

URL=${POCKETBASE_URL:-http://localhost:8091/api/health}

if curl -s -f "$URL" > /dev/null; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed"
  exit 1
fi

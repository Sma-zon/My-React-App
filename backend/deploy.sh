#!/bin/bash

echo "=== Leaderboard Backend Deployment Script ==="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Test uuid module
echo "Testing UUID module..."
node -e "const { v4: uuidv4 } = require('uuid'); console.log('UUID test:', uuidv4());"

# Test server startup
echo "Testing server startup..."
timeout 5s node server.js &
SERVER_PID=$!
sleep 2
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "Server started successfully!"
    kill $SERVER_PID
else
    echo "Error: Server failed to start"
    exit 1
fi

echo "=== Deployment test completed successfully ===" 
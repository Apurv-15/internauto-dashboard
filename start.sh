#!/bin/bash

echo "🚀 Starting InternBot..."
echo ""

# Get the absolute path of the project root
PROJECT_ROOT=$(pwd)

# Check if backend dependencies are installed
if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd "$PROJECT_ROOT/server" && npm install
fi

# Check if frontend dependencies are installed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$PROJECT_ROOT" && npm install
fi

echo ""
echo "✅ Starting backend server..."

# Auto-kill any existing backend process on port 3001
echo "🧹 Cleaning up existing backend processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Run backend in a subshell so we don't change the current directory
(cd "$PROJECT_ROOT/server" && npm start) &
BACKEND_PID=$!

echo "⏳ Waiting 3 seconds for backend to initialize..."
sleep 3

echo ""
echo "✅ Starting frontend dashboard..."
cd "$PROJECT_ROOT"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT

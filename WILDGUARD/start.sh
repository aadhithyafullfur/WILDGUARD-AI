#!/bin/bash

################################################################################
# WildGuard Full-Stack Project Launcher
# Starts backend (Python ML server) and frontend (React) in one command
# Handles process management, logging, and graceful shutdown
################################################################################

set -o pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"
CLIENT_DIR="${SCRIPT_DIR}/client"

# Process IDs
BACKEND_PID=""
FRONTEND_PID=""

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${BLUE}[${timestamp}] [INFO]${NC} ${message}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[${timestamp}] [SUCCESS]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[${timestamp}] [ERROR]${NC} ${message}" >&2
            ;;
        WARN)
            echo -e "${YELLOW}[${timestamp}] [WARN]${NC} ${message}"
            ;;
    esac
}

# Cleanup function - stops both processes gracefully
cleanup() {
    log WARN "Shutting down..."
    
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log INFO "Stopping frontend (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null
        sleep 2
        kill -0 "$FRONTEND_PID" 2>/dev/null && kill -9 "$FRONTEND_PID" 2>/dev/null
    fi
    
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        log INFO "Stopping backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null
        sleep 2
        kill -0 "$BACKEND_PID" 2>/dev/null && kill -9 "$BACKEND_PID" 2>/dev/null
    fi
    
    log SUCCESS "Shutdown complete"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGINT SIGTERM EXIT

# Validate directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    log ERROR "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$CLIENT_DIR" ]; then
    log ERROR "Client directory not found: $CLIENT_DIR"
    exit 1
fi

log INFO "Starting WildGuard Full-Stack Project..."
log INFO "Backend dir: $BACKEND_DIR"
log INFO "Client dir: $CLIENT_DIR"

################################################################################
# Start Backend (Python ML Server)
################################################################################

log INFO "Starting backend..."

# Check if main.py exists
if [ ! -f "$BACKEND_DIR/main.py" ]; then
    log ERROR "Backend main.py not found at $BACKEND_DIR/main.py"
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    log ERROR "python3 is not installed or not in PATH"
    exit 1
fi

# Start backend in background with output to dedicated log file
cd "$BACKEND_DIR"
python3 main.py > "${SCRIPT_DIR}/.backend.log" 2>&1 &
BACKEND_PID=$!

log SUCCESS "Backend started (PID: $BACKEND_PID)"

# Give backend time to initialize
sleep 3

# Check if backend process is still alive
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    log ERROR "Backend failed to start. Check log: ${SCRIPT_DIR}/.backend.log"
    exit 1
fi

################################################################################
# Start Frontend (React)
################################################################################

log INFO "Starting frontend..."

# Check if package.json exists
if [ ! -f "$CLIENT_DIR/package.json" ]; then
    log ERROR "Frontend package.json not found at $CLIENT_DIR/package.json"
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
fi

# Check if node_modules exists, install if needed
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
    log WARN "node_modules not found. Running npm install..."
    cd "$CLIENT_DIR"
    npm install
    if [ $? -ne 0 ]; then
        log ERROR "npm install failed"
        kill "$BACKEND_PID" 2>/dev/null
        exit 1
    fi
fi

# Start frontend in foreground (main process)
cd "$CLIENT_DIR"
log SUCCESS "Frontend started"
log INFO "---------------------------------------------"
log INFO "WildGuard is now running!"
log INFO "Press Ctrl+C to stop all services"
log INFO "---------------------------------------------"

# Run frontend in foreground
npm start &
FRONTEND_PID=$!

# Wait for processes
wait

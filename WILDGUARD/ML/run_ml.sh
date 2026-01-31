#!/bin/bash
# Script to run the WILDGUARD ML module with local virtual environment

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
    echo "Installing dependencies..."
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel
    pip install Flask Flask-SocketIO opencv-python ultralytics requests python-socketio python-engineio
    deactivate
fi

# Activate virtual environment and run main.py
source venv/bin/activate
python main.py

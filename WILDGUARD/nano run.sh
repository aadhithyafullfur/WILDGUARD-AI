#!/bin/bash

echo "🚀 Starting Backend..."
gnome-terminal -- bash -c "cd backend && npm start; exec bash"

sleep 2

echo "🚀 Starting Client..."
gnome-terminal -- bash -c "cd client && npm start; exec bash"

sleep 2

echo "🚀 Starting ML..."
gnome-terminal -- bash -c "cd ML && python main.py; exec bash"

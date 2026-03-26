#!/bin/bash
cd "$(dirname "$0")"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed!"
    echo "Please install Python from: https://python.org/downloads"
    echo "Then double-click this file again."
    read -p "Press Enter to exit..."
    exit 1
fi

# Check for API key
if ! grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
    if ! grep -q "apiKey" config.json 2>/dev/null; then
        echo "Warning: No API key configured!"
        echo "Please edit .env file and add your API key."
        echo ""
    fi
fi

echo "Starting LexiGraph..."
echo "Please visit: http://localhost:3000"

# Start Python server
python3 START.py

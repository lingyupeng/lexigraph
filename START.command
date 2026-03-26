#!/bin/bash
cd "$(dirname "$0")"

# Show Chinese/English welcome based on system language
if [ "$(defaults read NSGlobalDomain AppleLanguages 2>/dev/null | head -1)" = "/zh" ]; then
    echo "========================================"
    echo "  LexiGraph - 启动中"
    echo "========================================"
else
    echo "========================================"
    echo "  LexiGraph - Starting"
    echo "========================================"
fi
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please download from: https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "[OK] Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Recreate bin links if missing (for portable packages)
if [ ! -e "node_modules/.bin/tsx" ]; then
    echo ""
    echo "[INFO] Installing dependencies..."
    npm install --include=dev --no-bin-links
    echo ""
    echo "[INFO] Rebuilding bin links..."
    npm rebuild
fi

# Kill any process on port 3000
echo ""
echo "[INFO] Cleaning port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo ""
echo "========================================"
echo "  Starting server..."
echo "========================================"
echo ""
echo "Please visit: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the dev server in background and open browser
npm run dev &
sleep 3
open http://localhost:3000

# Keep terminal open
echo ""
echo "Server is running. You can minimize this window."
echo "Close this terminal to stop the server."
read -p "Press Enter to exit..."

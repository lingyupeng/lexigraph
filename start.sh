#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "  LexiGraph - 启动中"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[错误] 未安装 Node.js"
    echo "请访问 https://nodejs.org 下载安装"
    read -p "按 Enter 键退出..."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v)
echo "[OK] Node.js 版本: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[INFO] 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        read -p "按 Enter 键退出..."
        exit 1
    fi
fi

# Kill any process on port 3000
echo ""
echo "[INFO] 清理端口 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo ""
echo "========================================"
echo "  启动中..."
echo "========================================"
echo ""
echo "请访问: http://localhost:3000"
echo "按 Ctrl+C 停止服务器"
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

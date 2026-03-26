@echo off
echo ================================================
echo   LexiGraph - Python Server
echo ================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Python is not installed!
        echo.
        echo Please install Python 3.7+ first:
        echo 1. Visit: https://python.org/downloads
        echo 2. Download and install Python 3
        echo 3. Make sure to check "Add Python to PATH"
        echo 4. Restart CMD and run this file again
        pause
        exit /b 1
    )
    set PYTHON=python3
) else (
    set PYTHON=python
)

echo [OK] Found Python
echo.

:: Check if API key is configured
grep -q "OPENAI_API_KEY" .env 2>nul
if %errorlevel% neq 0 (
    grep -q "apiKey" config.json 2>nul
    if %errorlevel% neq 0 (
        echo [WARNING] No API key configured!
        echo Please edit .env file or config.json
        echo.
    )
)

:: Start Python server
echo [INFO] Starting server...
echo Please visit: http://localhost:3000
echo Press Ctrl+C to stop
echo.

%PYTHON% START.py
pause

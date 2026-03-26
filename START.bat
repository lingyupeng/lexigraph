@echo off
echo ================================================
echo   LexiGraph - Starting
echo ================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 18+ first:
    echo 1. Visit: https://nodejs.org
    echo 2. Download and install the LTS version
    echo 3. Restart your computer
    echo 4. Double-click this file again
    echo.
    pause
    exit /b 1
)

:: Check Node version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

:: Check if dependencies are installed
if not exist "node_modules" (
    echo.
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Rebuild bin links if missing
if not exist "node_modules\.bin\tsx" (
    echo.
    echo [INFO] Rebuilding dependencies...
    call npm rebuild
)

echo.
echo ================================================
echo   Starting server...
echo ================================================
echo.
echo Please visit: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

:: Start the server and open browser
start http://localhost:3000
npm run dev

pause

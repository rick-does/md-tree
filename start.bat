@echo off
setlocal
set ROOT=%~dp0

echo ==> .mdTree
echo.

REM Build frontend
echo ==> Building frontend...
cd "%ROOT%frontend"
if not exist "node_modules" (
    echo     Installing npm packages...
    npm install
    if errorlevel 1 ( echo ERROR: npm install failed & exit /b 1 )
)
node node_modules/vite/bin/vite.js build
if errorlevel 1 ( echo ERROR: Frontend build failed & exit /b 1 )

REM Start backend
echo.
echo ==> Starting server on http://localhost:8002
echo     Press Ctrl+C to stop.
echo.
cd "%ROOT%backend"
if not exist ".venv" (
    echo     Creating virtualenv...
    python -m venv .venv
    if errorlevel 1 ( echo ERROR: Could not create virtualenv. Is Python installed? & exit /b 1 )
    .venv\Scripts\pip install -q -r requirements.txt
    if errorlevel 1 ( echo ERROR: pip install failed & exit /b 1 )
)

REM Free port 8002 if something is already using it
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8002 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

call .venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8002

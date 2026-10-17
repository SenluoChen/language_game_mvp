@echo off
title French Life MVP
echo.
echo ======================================
echo       French Life MVP
echo ======================================
echo.
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js / npm is not installed.
  echo Install Node.js 20+ from https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if %errorlevel% neq 0 (
    echo npm install failed.
    pause
    exit /b 1
  )
)
echo.
echo Starting app...
echo Open the URL shown below in your browser.
echo.
call npm run dev
pause

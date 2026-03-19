@echo off
setlocal
set PORT=8000
cd /d "%~dp0"

echo Starting TG OS from:
echo %CD%
echo.

start "" cmd /c "timeout /t 2 >nul && start http://localhost:%PORT%"

where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
  goto :eof
)

echo Python was not found on this system.
echo Install Python or open index.html directly as a fallback.
pause

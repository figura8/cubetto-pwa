@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "LIVE_DIR=%%~fI\cubetto-pwa"
set "PORT=8080"

if not exist "%LIVE_DIR%\index.html" (
  echo Cartella live non trovata:
  echo %LIVE_DIR%
  pause
  exit /b 1
)

echo Avvio demo offline da:
echo %LIVE_DIR%
echo.
echo Apri nel browser:
echo http://localhost:%PORT%
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  set "PY_CMD=python"
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    set "PY_CMD=py -3"
  ) else (
    echo Python non trovato. Installa Python oppure avvia un server locale manualmente.
    pause
    exit /b 1
  )
)

start "BOKS Offline Server" cmd /k "cd /d \"%LIVE_DIR%\" && %PY_CMD% -m http.server %PORT%"
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%"

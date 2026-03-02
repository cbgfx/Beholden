@echo off
setlocal

echo === Installing deps (if needed) ===
call npm install
if errorlevel 1 goto :fail

echo === Building web ===
call npm run build
if errorlevel 1 goto :fail

echo === Opening browser ===
REM Pick one:
start "" "http://localhost:5174"

echo === Starting server ===
call npm start
if errorlevel 1 goto :fail

goto :eof

:fail
echo.
echo === Beholden failed to start. See error above. ===
pause
@echo off
setlocal
cd /d %~dp0
echo Starting DM Tool LAN...
if not exist node_modules (
  npm install
)
start "" http://localhost:5173
npm run dev

@echo off
start cmd /k "cd /d C:\xampp\htdocs\dashboard\my-filter-api && npm run dev"
timeout /t 5 >nul

start cmd /k "cd /d C:\Users\corei7\Desktop\doku-integration && npm run dev"
timeout /t 5 >nul

start cmd /k "cd /d C:\Users\corei7\Desktop\auto_bunyi && py autobunyi.py "
timeout /t 5 >nul

start cmd /k "cd /d C:\Users\corei7\Desktop\beta && py omega.py"

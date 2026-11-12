@echo off
setlocal
set "BOZ_PY=D:\TELCOHAUZ_BOZ_AI_WORKFORCE\tools\python-3.12.10\python.exe"
if not exist "%BOZ_PY%" exit /b 2
"%BOZ_PY%" "D:\TELCOHAUZ_BOS\00_CONTROL_CENTER\register_schedule.py"
exit /b %ERRORLEVEL%

@echo off
REM Smoke Test for Tachikoma Dashboard
REM
REM Usage:
REM   dashboard-smoke-test.bat

setlocal

set "PYTHON=%~dp0..\..\assets\Python310\python.exe"

if not exist "%PYTHON%" (
    echo [ERROR] Python not found at %PYTHON%
    exit /b 1
)

"%PYTHON%" "%~dp0test_smoke.py"

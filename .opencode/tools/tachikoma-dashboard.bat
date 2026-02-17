@echo off
REM Tachikoma Dashboard Bootstrapper
REM - Uses injected Python or bundled Python
REM - Downloads uv if not present
REM - Creates venv if needed
REM - Runs the dashboard

setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0..\tools"
set "ASSETS_DIR=%~dp0..\assets"
set "DASHBOARD_DIR=%~dp0..\tools\dashboard"
set "VENV_DIR=%DASHBOARD_DIR%\.venv"

REM Try to find Python from PATH first (injected by opencode)
where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where python') do (
        set "PYTHON=%%i"
        goto :python_found
    )
) else (
    set "PYTHON=%ASSETS_DIR%\Python310\python.exe"
)

:python_found

if not exist "%PYTHON%" (
    echo Error: Python not found
    exit /b 1
)

REM Find or download uv
set "UV=%ASSETS_DIR%\uv.exe"
if not exist "%UV%" (
    echo Downloading uv...
    powershell -Command "Invoke-WebRequest -Uri 'https://astral.sh/uv/latest/uv-x86_64-pc-windows-msvc.zip' -OutFile '%TEMP%\uv.zip'"
    powershell -Command "Expand-Archive -Path '%TEMP%\uv.zip' -DestinationPath '%ASSETS_DIR%' -Force"
    del /q "%TEMP%\uv.zip" 2>nul
    if not exist "%UV%" (
        echo Error: Failed to download uv
        exit /b 1
    )
)

REM Change to dashboard directory
cd /d "%DASHBOARD_DIR%" 2>nul
if errorlevel 1 (
    echo Error: Cannot access dashboard directory
    exit /b 1
)

REM Create venv if needed using uv, and install deps
if not exist "%VENV_DIR%\Scripts\python.exe" (
    echo Creating virtual environment with uv...
    "%UV%" venv --python "%PYTHON%" "%VENV_DIR%"
    "%UV%" pip install --python "%VENV_DIR%\Scripts\python.exe" textual rich
) else (
    REM Check if dependencies are installed
    "%VENV_DIR%\Scripts\python.exe" -c "import textual" 2>nul
    if errorlevel 1 (
        echo Installing dependencies...
        "%UV%" pip install --python "%VENV_DIR%\Scripts\python.exe" textual rich
    )
)

REM Run the dashboard
"%VENV_DIR%\Scripts\python.exe" -m tachikoma_dashboard %*

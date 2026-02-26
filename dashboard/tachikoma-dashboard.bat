@echo off
REM Tachikoma Dashboard Bootstrapper (Standalone)
REM - Uses Python and uv from PATH
REM - Creates venv if needed
REM - Runs the dashboard or tests

setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "VENV_DIR=%SCRIPT_DIR%.venv"
set "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

set "RUN_TESTS=0"
set "RUN_UNIT_TESTS=0"
set "ARGS="

for %%a in (%*) do (
    if "%%a"=="--test" (
        set "RUN_TESTS=1"
    ) else if "%%a"=="--pytest" (
        set "RUN_UNIT_TESTS=1"
    ) else if "%%a"=="--help" (
        goto :show_help
    ) else if "%%a"=="-h" (
        goto :show_help
    ) else (
        set "ARGS=!ARGS! %%a"
    )
)

REM Check for Python
where python >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found in PATH
    exit /b 1
)

REM Check for uv
where uv >nul 2>&1
if errorlevel 1 (
    echo Error: uv not found in PATH. Install with: pip install uv
    exit /b 1
)

REM Change to script directory
cd /d "%SCRIPT_DIR%"

REM Create venv if needed
if not exist "%VENV_PYTHON%" (
    echo Creating virtual environment with uv...
    uv venv
)

echo Syncing dependencies...
uv sync

REM Run tests or dashboard
if "%RUN_TESTS%"=="1" (
    echo Running dashboard smoke tests...
    uv run python test_smoke_no_rich.py
    exit /b %errorlevel%
)

if "%RUN_UNIT_TESTS%"=="1" (
    echo Running pytest unit tests...
    uv run pytest tests/ -v
    exit /b %errorlevel%
)

REM Run the dashboard
uv run python -m tachikoma_dashboard %ARGS%
exit /b %errorlevel%

:show_help
echo.
echo Tachikoma Dashboard - Real-time agent monitoring
echo.
echo Usage: tachikoma-dashboard [OPTIONS]
echo.
echo Options:
echo   -i, --interval INT     Refresh interval in milliseconds (default: 2000)
echo   -c, --cwd PATH         Filter by working directory
echo   -a, --all-sessions     Show all sessions
echo   -j, --json             One-shot JSON output (no TUI)
echo   --test                 Run smoke tests
echo   --pytest               Run pytest unit tests
echo   -h, --help             Show this help
echo.
echo Examples:
echo   tachikoma-dashboard                  Start dashboard
echo   tachikoma-dashboard --json           Output as JSON
echo   tachikoma-dashboard --test           Run smoke tests
echo   tachikoma-dashboard --pytest         Run unit tests
echo.
exit /b 0

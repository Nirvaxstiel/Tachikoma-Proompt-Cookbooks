@echo off
REM Tachikoma Dashboard Bootstrapper
REM - Uses injected Python or bundled Python
REM - Uses uv from PATH or bundled binary
REM - Creates venv if needed
REM - Runs the dashboard or tests

setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0..\tools"
set "ASSETS_DIR=%~dp0..\assets"
set "DASHBOARD_DIR=%~dp0..\tools\dashboard"
set "VENV_DIR=%DASHBOARD_DIR%\.venv"

REM Check for --test flag
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

REM Find uv - try PATH first (injected by opencode), then bundled
where uv >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where uv') do (
        set "UV=%%i"
        goto :uv_found
    )
) else (
    set "UV=%ASSETS_DIR%\uv.exe"
)

:uv_found

if not exist "%UV%" (
    echo Error: uv not found in PATH or at %ASSETS_DIR%\uv.exe
    exit /b 1
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

REM Run tests or dashboard
if "%RUN_TESTS%"=="1" (
    echo Running dashboard smoke tests...
    "%VENV_DIR%\Scripts\python.exe" "%DASHBOARD_DIR%\test_smoke_no_rich.py"
    exit /b %errorlevel%
)

if "%RUN_UNIT_TESTS%"=="1" (
    echo Running pytest unit tests...
    "%UV%" pip install --python "%VENV_DIR%\Scripts\python.exe" pytest pytest-cov >nul 2>&1
    "%VENV_DIR%\Scripts\python.exe" -m pytest tests/ -v
    exit /b %errorlevel%
)

REM Run the dashboard
"%VENV_DIR%\Scripts\python.exe" -m tachikoma_dashboard %ARGS%
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

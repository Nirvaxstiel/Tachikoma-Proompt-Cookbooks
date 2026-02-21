@echo off
REM
REM Smoke Test Runner Wrapper (Windows)
REM - Uses injected Python or bundled Python
REM - Downloads uv if not present
REM - Sets environment variables for the session
REM
REM Usage:
REM   run-smoke-tests.bat                # Run all tests
REM   run-smoke-tests.bat python         # Test Python scripts only
REM   run-smoke-tests.bat shell          # Test Shell scripts only
REM   run-smoke-tests.bat --fail-fast    # Stop on first failure
REM

setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "OPENCODE_DIR=%~dp0.."
set "ASSETS_DIR=%OPENCODE_DIR%\assets"

REM ===========================================================================
REM Python Detection: PATH -> Bundled Python
REM ===========================================================================
set "PYTHON="
set "UV="

where python >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where python') do (
        set "PYTHON=%%i"
        goto :python_found
    )
) else (
    where python3 >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "delims=" %%i in ('where python3') do (
            set "PYTHON=%%i"
            goto :python_found
        )
    ) else (
        if exist "%ASSETS_DIR%\Python310\python.exe" (
            set "PYTHON=%ASSETS_DIR%\Python310\python.exe"
        ) else if exist "%ASSETS_DIR%\Python\python.exe" (
            set "PYTHON=%ASSETS_DIR%\Python\python.exe"
        ) else if exist "%OPENCODE_DIR%\Python310\python.exe" (
            set "PYTHON=%OPENCODE_DIR%\Python310\python.exe"
        )
    )
)

:python_found

if not defined PYTHON (
    echo [ERROR] Python not found in PATH or bundled locations
    echo Please install Python 3.10+ or place bundled Python in assets folder
    exit /b 1
)

echo [INFO] Using Python: %PYTHON%

REM ===========================================================================
REM UV Detection: PATH -> Bundled UV -> Download
REM ===========================================================================

where uv >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where uv') do (
        set "UV=%%i"
        goto :uv_found
    )
)

REM Try bundled uv
if exist "%ASSETS_DIR%\uv.exe" (
    set "UV=%ASSETS_DIR%\uv.exe"
) else if exist "%OPENCODE_DIR%\uv.exe" (
    set "UV=%OPENCODE_DIR%\uv.exe"
) else (
    REM Download uv if not found
    echo [INFO] uv not found, downloading...
    powershell -Command "Invoke-WebRequest -Uri 'https://astral.sh/uv/latest/uv-x86_64-pc-windows-msvc.zip' -OutFile '%TEMP%\uv.zip'" 2>nul
    if exist "%TEMP%\uv.zip" (
        powershell -Command "Expand-Archive -Path '%TEMP%\uv.zip' -DestinationPath '%ASSETS_DIR%' -Force"
        del /q "%TEMP%\uv.zip" 2>nul
    )

    REM Check if uv was downloaded
    if exist "%ASSETS_DIR%\uv.exe" (
        set "UV=%ASSETS_DIR%\uv.exe"
    ) else if exist "%ASSETS_DIR%\uv\uv.exe" (
        set "UV=%ASSETS_DIR%\uv\uv.exe"
    )
)

:uv_found

if defined UV (
    echo [INFO] Using UV: %UV%
) else (
    echo [WARN] UV not found - some features may not work
)

REM ===========================================================================
REM Export environment variables for child processes (via setx would be permanent)
REM For session-only, we pass them to the subprocess
REM ===========================================================================

echo.
echo ======================================
echo Running Smoke Tests
echo ======================================
echo Python: %PYTHON%
echo UV: %UV%
echo Arguments: %*
echo.

REM Run the actual smoke test script
REM Pass PYTHON and UV as environment variables to the subprocess
set "PYTHON_CMD=%PYTHON%"
if defined UV (
    "%PYTHON_CMD%" "%SCRIPT_DIR%smoke_test.py" %*
) else (
    "%PYTHON_CMD%" "%SCRIPT_DIR%smoke_test.py" %*
)

set "EXIT_CODE=%ERRORLEVEL%"

echo.

if %EXIT_CODE% EQU 0 (
    echo [OK] All smoke tests passed!
) else if %EXIT_CODE% EQU 1 (
    echo [FAIL] Some smoke tests failed!
) else (
    echo [WARN] Smoke tests exited with code %EXIT_CODE%
)

exit /b %EXIT_CODE%

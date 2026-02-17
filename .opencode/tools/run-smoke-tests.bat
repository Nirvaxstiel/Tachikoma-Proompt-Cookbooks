@echo off
REM
REM Smoke Test Runner Wrapper (Windows)
REM Convenience wrapper for running smoke tests on Windows
REM
REM Usage:
REM   run-smoke-tests.bat                # Run all tests
REM   run-smoke-tests.bat python         # Test Python scripts only
REM   run-smoke-tests.bat shell          # Test Shell scripts only
REM   run-smoke-tests.bat --fail-fast    # Stop on first failure
REM

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"

REM Check if Python is available
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=python"
) else (
    where python3 >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PYTHON_CMD=python3"
    ) else (
        echo [ERROR] Python not found in PATH
        echo Please install Python 3.6 or higher
        exit /b 1
    )
)

echo ======================================
echo Running Smoke Tests
echo ======================================
echo Python command: %PYTHON_CMD%
echo Arguments: %*
echo.

REM Run the actual smoke test script
"%PYTHON_CMD%" "%SCRIPT_DIR%smoke_test.py" %*

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

@echo off
REM ============================================================================
REM Shared Batch Utilities for Tachikoma
REM
REM This file provides common batch utilities for Tachikoma scripts,
REM consolidating duplicate echo formatting functions.
REM
REM Usage:
REM   call %~dp0shared\batch-utils.bat :function_name [args]
REM
REM ============================================================================

REM ============================================================================
REM Print Functions
REM ============================================================================

REM Print a styled header
:print_header
set "title=%~1"
echo ======================================
echo %title%
echo ======================================
goto :eof

REM Print a success message
:print_success
set "message=%~1"
echo [OK] %message%
goto :eof

REM Print an error message
:print_error
set "message=%~1"
echo [ERROR] %message%
goto :eof

REM Print a warning message
:print_warning
set "message=%~1"
echo [WARN] %message%
goto :eof

REM Print an info message
:print_info
set "message=%~1"
echo [INFO] %message%
goto :eof

REM Print a divider line
:print_divider
set "char=%~1"
set "width=%~2"
if "%char%"=="" set "char=="
if "%width%"=="" set "width=60"
goto :print_divider_execute

REM Print a horizontal rule
:print_hr
echo ============================================================
goto :eof

REM Print a section header
:print_section
set "title=%~1"
echo.
echo %title%
echo ------------------------------------------------------------
goto :eof

REM Print a checkmark with message
:print_check
set "message=%~1"
echo [CHECK] %message%
goto :eof

REM Print an X mark with message
:print_x
set "message=%~1"
echo [X] %message%
goto :eof

REM Print separator
:print_separator
echo.
echo.
goto :eof

REM ============================================================================
REM Utility Functions
REM ============================================================================

REM Print script start banner
:print_script_start
set "script_name=%~1"
echo.
echo ======================================
echo Running: %script_name%
echo ======================================
echo.
goto :eof

REM Print script end summary
:print_script_end
set "exit_code=%~1"
if "%exit_code%"=="0" (
    echo [OK] Script completed successfully
) else if "%exit_code%"=="1" (
    echo [ERROR] Script failed
) else (
    echo [WARN] Script exited with code %exit_code%
)
goto :eof

REM Print step header
:print_step
set "step_num=%~1"
set "step_name=%~2"
echo [%step_num%] %step_name%
echo ------------------------------------------------------------
goto :eof

REM ============================================================================
REM Internal Helper: Print Divider
REM ============================================================================

:print_divider_execute
set "line="
if %width% LEQ 0 set "width=60"
setlocal enabledelayedexpansion
:div_loop
if %width% GTR 0 (
    set "line=!line!%char%"
    set /a width=width-1
    goto :div_loop
)
endlocal & set "line=%line%"
echo %line%
goto :eof

REM ============================================================================
REM End of File
REM ============================================================================

:eof

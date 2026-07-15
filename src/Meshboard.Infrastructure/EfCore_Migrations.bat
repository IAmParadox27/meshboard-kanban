@echo off
setlocal

set FRESH=0

if /i "%~1"=="--fresh" (
    set FRESH=1
)

set /p MIGRATION_NAME=Enter migration name: 

if "%FRESH%"=="1" (
    echo Running fresh migration reset...
    dotnet ef database update 0 --project Meshboard.Infrastructure --startup-project Meshboard.Api
    if errorlevel 1 exit /b 1

    dotnet ef migrations remove --project Meshboard.Infrastructure --startup-project Meshboard.Api
    if errorlevel 1 exit /b 1
)

dotnet ef migrations add %MIGRATION_NAME% --project Meshboard.Infrastructure --startup-project Meshboard.Api

if errorlevel 1 exit /b 1

echo Done.
exit /b 0
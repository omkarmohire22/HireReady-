@echo off
echo ========================================================
echo Starting HireReady Backend Server
echo ========================================================
echo Activating virtual environment...

call .\venv\Scripts\activate.bat
if errorlevel 1 (
    echo Failed to activate virtual environment! Please check if 'venv' exists.
    pause
    exit /b 1
)

echo Starting Uvicorn server...
python -m uvicorn main:app --reload --port 8000
pause

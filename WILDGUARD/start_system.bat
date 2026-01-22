@echo off
echo Starting WILDGUARD Real-Time Surveillance System...
echo.

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Install requirements if not already installed
pip install -r requirements.txt

REM Start the Flask application
python app.py

pause
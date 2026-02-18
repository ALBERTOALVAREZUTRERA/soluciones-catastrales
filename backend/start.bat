@echo off
echo Iniciando Backend Catastral FastAPI...
echo.

cd /d "%~dp0"

IF NOT EXIST "venv" (
    echo ERROR: No se encuentra el entorno virtual venv
    echo Por favor ejecuta: python -m venv venv
    pause
    exit /b 1
)

echo Activando entorno virtual...
call venv\Scripts\activate.bat

echo.
echo Ejecutando servidor en http://localhost:8000
echo Documentacion API: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python main.py

pause

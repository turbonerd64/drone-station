@echo off
title Drone Station - Novation Launchkey Ambient Drone Machine
color 0b
cd /d "%~dp0"

echo =====================================================================
echo                DRONE STATION - AMBIENT BACKING ENGINE
echo           Optimized for Novation Launchkey Mini & Web Audio
echo =====================================================================
echo.
echo [1/2] Launching Drone Station dashboard in your browser...
start http://127.0.0.1:5432

echo.
echo =====================================================================
echo  Drone Station is LIVE at http://127.0.0.1:5432
echo.
echo  - Connect your Novation Launchkey Mini via USB.
echo  - Press any note (e.g. F) or chord (e.g. Fmaj7) to latch an infinite drone.
echo  - Use Launchkey knobs for Filter, Space, Freeze, and Octaves.
echo  - Close this window or press Ctrl+C when you want to exit.
echo =====================================================================
echo.
echo [2/2] Running local audio server...
python server.py
pause

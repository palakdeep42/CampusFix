@echo off
title CampusFix — Smart Campus Issue Reporting Platform
echo =========================================================================
echo   CampusFix — Smart Campus Issue Reporting Platform
echo   1-Hour Web Development Competition Prototype
echo =========================================================================
echo.
echo Launching local server at http://localhost:8080 ...
echo Opening your default browser...
start http://localhost:8080
echo.
echo Server active. Press Ctrl+C in this terminal window to stop.
echo.
python -m http.server 8080
pause

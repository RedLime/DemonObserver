@echo off
cls
echo This script will keep your server running even after crashing!
title DemonObserver Watchdog
:StartServer
call npm start
echo (%time%) Server closed/crashed... restarting!
goto StartServer
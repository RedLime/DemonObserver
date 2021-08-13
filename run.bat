@echo off
cls
echo This script will keep your bot running even after crashing!
title DemonObserver Watchdog
:StartServer
start /wait node app.js
echo (%time%) Bot shutdowned or crashed... restarting!
timeout 3
goto StartServer
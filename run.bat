@echo off
cls
echo This script will keep your bot running even after crashing!
title DemonObserver Watchdog
:StartServer
start /wait npm start
echo (%time%) Bot shutdowned or crashed... restarting!
timeout 3
goto StartServer
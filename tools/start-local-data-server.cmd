@echo off
cd /d "%~dp0.."
start "Bhan Local Data Server" /min node "%~dp0local-data-server.js"

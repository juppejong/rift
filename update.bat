@echo off
REM Kopieert de nieuwste stats.js uit de app-map en pusht alles naar GitHub (live in ~1 minuut).
cd /d "%~dp0"
if exist "..\lol-companion\stats.js" copy /Y "..\lol-companion\stats.js" "stats.js" >nul
git add -A
git diff --cached --quiet && (echo Geen wijzigingen om te pushen. & exit /b 0)
git commit -m "Update %date% %time%"
git push
echo.
echo Klaar. De site is over ongeveer een minuut bijgewerkt.
pause

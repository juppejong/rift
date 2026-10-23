@echo off
REM Bouwt de site opnieuw op vanuit de app-map (incl. vertalingen en stats.js) en pusht alles naar GitHub.
cd /d "%~dp0"
if exist "..\lol-companion\make-pages.js" node "..\lol-companion\make-pages.js"
git add -A
git diff --cached --quiet && (echo Geen wijzigingen om te pushen. & exit /b 0)
git commit -m "Update %date% %time%"
git push
echo.
echo Klaar. De site is over ongeveer een minuut bijgewerkt.
pause

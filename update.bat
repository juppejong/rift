@echo off
REM Eén bestand om alles bij te werken en naar GitHub te pushen.
REM   update.bat         -> spelers opnieuw ophalen, site opnieuw opbouwen, pushen
REM   update.bat data    -> ook 1000 NIEUWE matches ophalen voor de win rates (ca. 30 min)
REM   update.bat reset   -> matchdata helemaal opnieuw beginnen (gebruik bij een nieuwe patch, ca. 40 min)
REM Voor het ophalen is een geldige Riot-key nodig in lol-companion\.env (development keys verlopen na 24 uur).
set "APP=%~dp0..\lol-companion"
cd /d "%APP%"
if /I "%1"=="data" node collect.js --add 1000
if /I "%1"=="reset" node collect.js --matches 1500 --reset
if errorlevel 1 (echo Matchdata ophalen mislukt - is je API-key verlopen? & pause & exit /b 1)
node snapshot.js
if errorlevel 1 echo Spelers verversen mislukt (key verlopen?) - de vorige spelersdata blijft staan.
node make-pages.js
cd /d "%~dp0"
git add -A
git diff --cached --quiet && (echo Geen wijzigingen om te pushen. & pause & exit /b 0)
git commit -m "Update %date% %time%"
git push
echo.
echo Klaar. De site is over ongeveer een minuut bijgewerkt.
pause

@echo off
echo ====================================
echo DEPLOY: Video/Audio Message Fix
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] Adding changed files...
git add components/wizard/wizard-client.tsx
git add app/api/messages/route.ts
echo     ✓ Files staged

echo.
echo [2/3] Creating commit...
git commit -m "fix: handle formdata upload + real api errors"
echo     ✓ Commit created

echo.
echo [3/3] Pushing to repository...
git push
echo     ✓ Push completed

echo.
echo ====================================
echo ✓ DEPLOYMENT INITIATED
echo ====================================
echo.
echo Vercel will auto-deploy in ~3 minutes
echo Monitor: https://vercel.com/dashboard
echo.
pause

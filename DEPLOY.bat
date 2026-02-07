@echo off
echo ====================================
echo DEPLOYANDO CAMBIOS A VERCEL
echo ====================================
echo.

cd /d "%~dp0"

echo [1/4] Agregando archivos modificados...
git add app/api/auth/magic-link/route.ts
git add components/auth/magic-link-form.tsx
echo     ✓ Archivos agregados

echo.
echo [2/4] Creando commit...
git commit -m "feat: login directo sin verificacion de email para testing"
echo     ✓ Commit creado

echo.
echo [3/4] Enviando cambios al repositorio...
git push
echo     ✓ Push completado

echo.
echo [4/4] Deployment iniciado en Vercel
echo     ► Ve a https://vercel.com/dashboard para ver el progreso
echo     ► El deployment toma ~2-3 minutos
echo.
echo ====================================
echo ✓ PROCESO COMPLETADO
echo ====================================
echo.
pause

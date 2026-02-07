@echo off
echo ====================================
echo REVIRTIENDO AL FLUJO CON MAGIC LINKS
echo ====================================
echo.

cd /d "%~dp0"

echo Este script revertirá el último commit que habilitó
echo el login directo sin verificación de email.
echo.
echo Presiona cualquier tecla para continuar o Ctrl+C para cancelar...
pause > nul

echo.
echo [1/3] Revirtiendo commit...
git revert HEAD --no-edit
echo     ✓ Commit revertido

echo.
echo [2/3] Enviando cambios al repositorio...
git push
echo     ✓ Push completado

echo.
echo [3/3] Verificando deployment en Vercel...
echo     ► El flujo con magic links se restaurará en ~2-3 minutos
echo     ► Los usuarios deberán verificar su email nuevamente
echo.
echo ====================================
echo ✓ REVERSION COMPLETADA
echo ====================================
echo.
pause

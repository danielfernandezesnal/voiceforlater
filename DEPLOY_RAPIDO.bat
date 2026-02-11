@echo off
echo ===========================================
echo       DEPLOY RAPIDO A PRODUCCION 🚀
echo ===========================================
echo.
echo 1. Deteniendo servidor local... (si lo tenias abierto, cerralo manualmente antes)
echo.

echo 2. Iniciando despliegue directo a Vercel...
echo    (Esto enviara tus archivos locales directamente)
echo.
call npx vercel --prod --yes

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ HUBO UN ERROR EN EL DESPLIEGUE.
    echo Revisa los mensajes de arriba.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ✅ LISTO! Tu sitio se actualizo exitosamente.
echo 👉 https://voiceforlater.vercel.app
echo.
pause

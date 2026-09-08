@echo off
title Controle de Boletos - Servidor
chcp 65001 >nul

echo ========================================================
echo        INICIANDO SISTEMA CONTROLE DE BOLETOS
echo ========================================================
echo.

cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo [1/3] Iniciando o Banco de Dados e Backend...
start "Backend (Servidor)" cmd /c "node backend/server.js"

echo [2/3] Iniciando a Tela do Sistema (Frontend)...
start "Frontend (Tela)" cmd /c "cd frontend && npx vite --host"

echo [3/3] Criando Link Seguro para Acesso Remoto (Celular)...
if exist cloudflare.log del cloudflare.log
start "Link Remoto (Cloudflare)" /min cmd /c "npx -y cloudflared tunnel --protocol http2 --url http://localhost:5173 > cloudflare.log 2>&1"

echo.
echo Aguardando geracao do link seguro... (isso pode levar alguns segundos)
:wait_for_link
timeout /t 2 /nobreak >nul
findstr /C:"trycloudflare.com" cloudflare.log >nul 2>&1
if %errorlevel% neq 0 goto wait_for_link

for /f "tokens=4" %%I in ('findstr "trycloudflare.com" cloudflare.log ^| findstr "https://"') do set CLOUDFLARE_URL=%%I

echo.
echo ========================================================
echo TUDO PRONTO! O sistema esta rodando.
echo.
echo Para acessar NO SEU COMPUTADOR, abra o navegador em:
echo http://localhost:5173
echo.
echo Para acessar NO SEU CELULAR (ou fora de casa):
echo Acesse o link seguro abaixo:
echo %CLOUDFLARE_URL%
echo ========================================================
echo.
echo (Mantenha as janelas que abriram funcionando para 
echo o sistema continuar no ar. Voce pode minimizar elas.)
echo.
pause

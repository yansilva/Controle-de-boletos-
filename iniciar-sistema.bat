@echo off
title Controle de Boletos - Servidor
chcp 65001 >nul

echo ========================================================
echo        INICIANDO SISTEMA CONTROLE DE BOLETOS
echo ========================================================
echo.

cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

:: Verificar e matar processos antigos nas portas usadas
echo [0/3] Verificando processos anteriores...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr "LISTENING" 2^>nul') do (
    echo      Finalizando processo antigo na porta 3001 (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    echo      Finalizando processo antigo na porta 5173 (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

:: Matar cloudflared antigo se existir
taskkill /IM cloudflared.exe /F >nul 2>&1

:: Pequena pausa para garantir que as portas foram liberadas
timeout /t 2 /nobreak >nul

echo      Portas liberadas!
echo.

echo [1/3] Iniciando o Banco de Dados e Backend...
start "Backend (Servidor)" cmd /c "node backend/server.js || (echo. & echo ERRO AO INICIAR O BACKEND! & pause)"

echo [2/3] Iniciando a Tela do Sistema (Frontend)...
start "Frontend (Tela)" cmd /c "cd frontend && npx vite --host || (echo. & echo ERRO AO INICIAR O FRONTEND! & pause)"

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

@echo off
echo Iniciando configuracion del proyecto...

echo.
echo [1/3] Configurando Frontend (Next.js)...
cd frontend
call npm install
if not exist .env.local (
    if exist .env.example (
        copy .env.example .env.local
    ) else (
        echo # Variables de Entorno Frontend > .env.local
    )
)
cd ..

echo.
echo [2/3] Configurando Backend (Laravel)...
cd backend
call composer install
if not exist .env (
    if exist .env.example (
        copy .env.example .env
    )
)
call php artisan key:generate
cd ..

echo.
echo [3/3] Configurando Quarkus...
cd quarkus
echo (Quarkus dependencias se descargaran via Maven/Gradle al compilar)
cd ..

echo.
echo Configuracion completada exitosamente!
echo Recuerda configurar tus variables de entorno (como Google Auth) en los archivos .env de cada proyecto.
pause

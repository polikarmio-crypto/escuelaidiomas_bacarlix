#!/bin/bash
echo "Iniciando configuración del proyecto..."

echo ""
echo "[1/3] Configurando Frontend (Next.js)..."
cd frontend || exit
npm install
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
    else
        echo "# Variables de Entorno Frontend" > .env.local
    fi
fi
cd ..

echo ""
echo "[2/3] Configurando Backend (Laravel)..."
cd backend || exit
composer install
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
    fi
fi
php artisan key:generate
cd ..

echo ""
echo "[3/3] Configurando Quarkus..."
cd quarkus || exit
echo "(Las dependencias de Quarkus se descargarán vía Maven/Gradle al compilar)"
cd ..

echo ""
echo "¡Configuración completada exitosamente!"
echo "Recuerda configurar tus variables de entorno (como Google Auth) en los archivos .env de cada proyecto."

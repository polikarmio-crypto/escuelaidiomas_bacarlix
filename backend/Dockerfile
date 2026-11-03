# ===============================================
# Dockerfile - Laravel API (Escuela de Idiomas)
# PHP 8.2 FPM + artisan serve
# ===============================================
FROM php:8.2-cli

# Instalar extensiones requeridas por Laravel y PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libicu-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    intl \
    opcache \
    pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer globalmente
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar archivos de dependencias primero (cache de layers)
COPY composer.json composer.lock* ./

# Instalar dependencias PHP
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copiar el resto del código fuente
COPY . .

# Asegurar directorios de storage y bootstrap/cache con permisos requeridos antes del autoload
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Generar autoload optimizado
RUN composer dump-autoload --optimize

# Generar clave de aplicación si no existe
RUN if [ ! -f .env ]; then cp .env.example .env; fi

EXPOSE 8000

# Ejecutar migraciones y seed al iniciar, luego servir
CMD php artisan key:generate --force; \
    php artisan migrate --force --seed; \
    php artisan serve --host=0.0.0.0 --port=8000

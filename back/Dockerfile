FROM php:8.2-apache

# Instalar dependencias del sistema i extensiones
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    git \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    default-mysql-client

# Instalar extensiones de PHP necesarias
RUN docker-php-ext-install pdo_mysql zip exif pcntl bcmath gd

# Habilitar mod_rewrite para Laravel
RUN a2enmod rewrite

# Establecer directorio de trabajo
WORKDIR /var/www/html

# Copiar el código de la aplicación
COPY . /var/www/html

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Instalar dependencias de PHP
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Ajustar permisos para storage y cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Configurar Apache DocumentRoot a public/
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf

# Puerto expuesto por Render/Heroku
EXPOSE 80

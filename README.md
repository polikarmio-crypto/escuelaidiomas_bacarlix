# Sistema de Gestión Académica — EIE

Sistema de la Escuela de Idiomas del Ejército (EIE). El proyecto se ejecuta mediante Docker Compose e incluye PostgreSQL, Laravel, Next.js y Quarkus.

---

## Equipo de Desarrollo y Asignación de Roles

A continuación se detalla el equipo de desarrollo, sus cuentas de GitHub, roles y responsabilidades en el proyecto:

| Integrante | Usuario de GitHub | Rol en el Proyecto | Rama Asignada | Responsabilidades y Módulos Principales |
| :--- | :--- | :--- | :---: | :--- |
| **Pablo Luis Medina Oroz** | [@polikarmio-crypto](https://github.com/polikarmio-crypto) | **Arquitectura Frontend, Seguridad de Acceso y Subsistema de Auditoría** | [Pablo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Pablo) | Arquitectura frontend Next.js 14, UI/UX institucional con radar y escudo EIE, AppShell, navegación protegida con retorno y login unificado con Google Auth, y diseño e implementación del **Subsistema de Logs y Auditoría Multinivel** (`storage/logs/{auth, almacen, academico, cajas, api}` y tabla `log_auditoria`). |
| **Arturo Wilder Figueredo Sanjinés** | [@figueredosanjinesarturowilder-0708](https://github.com/figueredosanjinesarturowilder-0708) | **Arquitectura Backend, Base de Datos y Gestión Académica** | [Arturo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Arturo) | Backend API RESTful en Laravel, modelos Eloquent, migraciones y seeders relacionales PostgreSQL, módulo académico, restricción docente estricta, asignación automatizada de docentes por especialidad y carga lectiva, y alta administrativa de estudiantes con credenciales institucionales. |
| **Ricardo Alexander Siles Rivero** | [@RicardoS2225](https://github.com/RicardoS2225) | **Módulo de Cajas, Recaudaciones y Control de Almacén** | [Ricardo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Ricardo) | Módulo de Cajas y Recaudaciones con transacciones atómicas contra condiciones de carrera en colas de atención y turnos, estabilización del inventario y almacén de libros, resolución de paginación de pedidos, órdenes de reposición y control de pagos y aranceles. |
| **Andre Sebastian Candia Ortiz** | [@AndreCandia0712](https://github.com/AndreCandia0712) | **Control de Asistencia, Modelos Numéricos y Microservicio Quarkus** | [Candia](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Candia) | Módulo de Control Diario de Asistencia y generador/visor de reportes oficiales en PDF con diseño institucional y firmas de control militar, modelos de proyección de demanda y capacidad operativa, microservicio reactivo Quarkus y orquestación con Docker Compose. |

---

## Guía de Consejos y Solución de Errores (Windows y Linux / CachyOS)

Para evitar problemas frecuentes entre los distintos sistemas operativos del equipo, seguir estas recomendaciones:

### A. Para Desarrolladores en Windows (PowerShell / CMD / Docker Desktop)

1. **Docker Desktop no inicia o da error de WSL 2:**
   - Asegurarse de tener la virtualización activada en la BIOS/UEFI (Intel VT-x o AMD-V).
   - Abrir PowerShell como Administrador y actualizar el subsistema:
     ```powershell
     wsl --update
     wsl --set-default-version 2
     ```
   - Reiniciar el equipo tras la instalación.

2. **Error de Fin de Línea (CRLF vs LF en scripts `.sh`):**
   - En Windows, Git suele convertir automáticamente los saltos de línea a `CRLF`, lo que genera el error `/bin/sh^M: bad interpreter` al ejecutar scripts dentro de los contenedores Linux.
   - Para evitarlo, configurar Git con:
     ```powershell
     git config --global core.autocrlf input
     ```
   - Si un script `.sh` da error de formato, en VS Code cambiar el fin de línea de `CRLF` a `LF` en la barra inferior derecha.

3. **Conflicto de Puertos en Windows (8000, 3000, 5432 ó 5433):**
   - Si un contenedor no levanta porque el puerto está ocupado (por ejemplo, Postgres local o IIS):
     ```powershell
     # Ver que proceso usa el puerto 8000 o 3000
     Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
     Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

     # En CMD clásico:
     netstat -ano | findstr :8000
     # Matar el proceso por su PID
     taskkill /PID <NUMERO_PID> /F
     ```

4. **Error de ejecución de scripts en PowerShell:**
   - Si PowerShell no permite ejecutar `setup.bat` o scripts locales:
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     ```

---

### B. Para Desarrolladores en Linux (Ubuntu, Debian, Fedora, Arch Linux / CachyOS)

1. **Docker requiere `sudo` para cada comando:**
   - Agregar el usuario actual al grupo docker:
     ```bash
     sudo usermod -aG docker $USER
     newgrp docker
     ```
   - Verificar con `docker ps` sin usar `sudo`.

2. **El servicio Docker no está corriendo (muy común en CachyOS / Arch / Fedora):**
   - Iniciar y habilitar el daemon de Docker con systemd:
     ```bash
     sudo systemctl enable --now docker
     ```
   - Si se usa Docker Desktop en Linux, verificar que el servicio de Docker esté activo.

3. **Permisos de escritura en Laravel (`storage/` y `bootstrap/cache`):**
   - En Linux, los archivos creados por el contenedor pertenecen a `root` o a `www-data`. Si Laravel dice `Permission denied`:
     ```bash
     sudo chmod -R 777 backend/storage backend/bootstrap/cache
     ```

4. **Scripts `.sh` sin permisos de ejecución:**
   - Si `setup.sh` no corre con `./setup.sh`:
     ```bash
     chmod +x setup.sh
     ./setup.sh
     ```

5. **Liberar puertos ocupados en Linux:**
   - Identificar y terminar procesos usando los puertos del sistema:
     ```bash
     sudo ss -tulpn | grep -E ':(3000|8000|5432|5433|8080)'
     # Para matar el proceso directamente:
     sudo fuser -k 8000/tcp
     sudo fuser -k 3000/tcp
     ```

6. **Memoria insuficiente o compilación congelada de Next.js / Quarkus:**
   - En distros ligeras o laptops sin SWAP suficiente, la compilación de Next.js puede cerrarse con `Killed (signal 9)`.
   - Crear un archivo SWAP temporal de 4 GB:
     ```bash
     sudo fallocate -l 4G /swapfile
     sudo chmod 600 /swapfile
     sudo mkswap /swapfile
     sudo swapon /swapfile
     ```

---

## Requisitos de Instalación

- Docker Desktop (Windows) o Docker Engine con Docker Compose (Linux).
- Git para clonar el repositorio.

No es necesario instalar PHP, Composer, Node.js, npm, Java ni Maven en el equipo: cada servicio utiliza su propio contenedor.

## 1. Descargar el proyecto

```bash
git clone https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix.git
cd escuelaidiomas_bacarlix
```

## 2. Configurar el entorno

Si el repositorio incluye un archivo `.env.example`, crea el archivo `.env` en la raíz del proyecto.

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS (Bash):**

```bash
cp .env.example .env
```

El archivo `docker-compose.yml` ya define valores predeterminados para `DB_USERNAME`, `DB_PASSWORD` y `NEXTAUTH_SECRET`. Para personalizarlos, configura estas variables en el `.env` de la raíz antes de iniciar los contenedores. No publiques contraseñas reales en Git.

## 3. Iniciar el sistema

Abre Docker Desktop (si utilizas Windows) o asegúrate de que el daemon de Docker esté iniciado (si utilizas Linux). Desde la carpeta raíz del proyecto, ejecuta:

**Windows (PowerShell/CMD):**
```powershell
docker compose up -d --build
```

**Linux (Bash):**
```bash
docker compose up -d --build
```

Este comando construye las imágenes necesarias e inicia los cuatro servicios: `postgres`, `backend`, `frontend` y `quarkus`. La primera ejecución puede tardar varios minutos.

Comprueba su estado con:

```bash
docker compose ps
```

## 4. Preparar la base de datos

Cuando PostgreSQL y Laravel estén iniciados, ejecuta las migraciones:

```bash
docker compose exec backend php artisan migrate --force
```

Si el proyecto incluye seeders y necesitas cargar datos iniciales:

```bash
docker compose exec backend php artisan db:seed --force
```

> **Atención:** no utilices `migrate:fresh` sobre una base con información que quieras conservar, porque elimina las tablas antes de recrearlas.

## 5. Abrir la aplicación

| Servicio | Dirección desde el equipo |
| --- | --- |
| Aplicación web (Next.js) | http://localhost:3000 |
| API Laravel | http://localhost:8000 |
| Microservicio Quarkus | http://localhost:8080 |
| PostgreSQL | `localhost:5433` (conexión desde DBeaver/pgAdmin) |

Dentro de la red Docker, Laravel y Quarkus se conectan a PostgreSQL usando el host `postgres` y el puerto `5432`.

## 6. Comandos útiles

```bash
# Ver estado de los contenedores
docker compose ps

# Consultar registros en tiempo real
docker compose logs -f

# Ver solo los registros de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicios
docker compose restart

# Reconstruir e iniciar después de cambios en Dockerfiles
docker compose up -d --build

# Detener contenedores (conserva los datos de postgres)
docker compose down
```

Para limpiar cachés de Laravel:

```bash
docker compose exec backend php artisan optimize:clear
```

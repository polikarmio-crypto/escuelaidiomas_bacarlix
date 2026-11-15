# Sistema de Gestión Académica — EIE

Sistema de la Escuela de Idiomas del Ejército (EIE). El proyecto se ejecuta mediante Docker Compose e incluye PostgreSQL, Laravel, Next.js y Quarkus.

---

## Equipo de Desarrollo y Asignación de Roles

A continuación se detalla el equipo de desarrollo, sus cuentas de GitHub, roles y responsabilidades en el proyecto:

| Integrante | Usuario de GitHub | Rol en el Proyecto | Rama Asignada | Responsabilidades y Módulos Principales |
| :--- | :--- | :--- | :---: | :--- |
| **Pablo Luis Medina Oroz** | [@polikarmio-crypto](https://github.com/polikarmio-crypto) | **Arquitectura Frontend, Seguridad de Acceso y Subsistema de Auditoría** | [Pablo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Pablo) | Arquitectura frontend Next.js 14, UI/UX institucional con radar y escudo EIE, AppShell, navegación protegida con retorno y login unificado con Google Auth (sin recordar última cuenta por seguridad), vistas de estudiantes y docentes aisladas para que solo vean sus propios datos, y subsistema de logs por carpetas (`storage/logs/{auth, almacen, academico, cajas, api}`) y tabla `log_auditoria`. |
| **Arturo Wilder Figueredo Sanjinés** | [@figueredosanjinesarturowilder-0708](https://github.com/figueredosanjinesarturowilder-0708) | **Arquitectura Backend, Base de Datos y Gestión Académica** | [Arturo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Arturo) | Backend API RESTful en Laravel, modelos Eloquent, migraciones 5FN y seeders relacionales PostgreSQL, módulo académico, rotación automática de docentes por idioma y carga lectiva, y filtros por idioma en asignación de docentes y estudiantes a paralelos. |
| **Ricardo Alexander Siles Rivero** | [@RicardoS2225](https://github.com/RicardoS2225) | **Módulo de Cajas, Recaudaciones, Almacén y Pruebas Unitarias** | [Ricardo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Ricardo) | Módulo de Cajas y Recaudaciones con transacciones atómicas contra condiciones de carrera en colas de atención y turnos, almacén de libros y cálculo ROP, calificaciones, pruebas unitarias con Mockito en Quarkus (`AnalyticsResourceMockitoTest`) y logs en archivo. |
| **Andre Sebastian Candia Ortiz** | [@AndreCandia0712](https://github.com/AndreCandia0712) | **Control de Asistencia, Modelos Numéricos y Microservicio Quarkus** | [Candia](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Candia) | Módulo de Control Diario de Asistencia y generador/visor de reportes oficiales en PDF con formato militar, modelos de proyección H3 (Mínimos Cuadrados, Simplex, Erlang-C), microservicio reactivo Quarkus y orquestación con Docker Compose. |

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

2. **Error de Fin de Línea (CRLF vs LF):**
   - En Windows, Git suele convertir automáticamente los saltos de línea a `CRLF`, lo que genera el error `/bin/sh^M: bad interpreter` al ejecutar comandos dentro de los contenedores Linux.
   - Para evitarlo, configurar Git con:
     ```powershell
     git config --global core.autocrlf input
     ```
   - Si un archivo de configuración o script da error de formato dentro del contenedor, en VS Code cambiar el fin de línea de `CRLF` a `LF` en la barra inferior derecha.

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

4. **PostgreSQL se apaga al iniciar o error de puerto ocupado (5432 vs 5433):**
   - Ocurre si ya tienes un servicio de PostgreSQL local instalado en Windows corriendo en el puerto 5432.
   - En el proyecto, el puerto expuesto al host se configuró en `5433:5432` en `docker-compose.yml` para evitar este conflicto.
   - Para conectarte desde herramientas externas (DBeaver, pgAdmin) debes apuntar al puerto `5433` (con usuario `postgres` y clave `postgres123`), mientras que internamente en Docker los servicios se comunican por el puerto estándar `5432`.

5. **El frontend de Next.js se apaga de golpe o no inicia en Docker:**
   - En Windows, a veces el volumen montado de `node_modules` causa conflicto de caché al compilar.
   - Para reconstruir la imagen del frontend ejecuta:
     ```powershell
     docker compose up -d --build frontend
     ```
   - O alternativamente, puedes correr el frontend directamente en tu máquina abriendo otra terminal (es más rápido y tiene hot-reload instantáneo):
     ```powershell
     cd frontend
     npm install
     npm run dev
     ```

6. **Error de conexión al migrar (`could not translate host name "postgres"` o `Connection refused`):**
   - Ocurre si ejecutas las migraciones inmediatamente después de `docker compose up -d` cuando la base de datos aún no ha terminado de inicializar su cluster.
   - Espera unos 5 a 10 segundos a que el contenedor de `postgres` esté listo y vuelve a ejecutar:
     ```powershell
     docker compose exec backend php artisan migrate --force
     ```

7. **Error de clave de cifrado en Laravel (`No application encryption key has been specified`):**
   - Si la aplicación muestra error de que falta el `APP_KEY`, genera la clave dentro del contenedor con:
     ```powershell
     docker compose exec backend php artisan key:generate
     ```

---

### B. Para Desarrolladores en Linux (Ubuntu, Debian, Fedora, Arch Linux / CachyOS)

1. **Docker requiere `sudo` para cada comando (error que le salió a Candia):**
   - Si al ejecutar comandos de Docker sale `permission denied while trying to connect to the Docker daemon socket`:
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
   - En Linux, los archivos creados por el contenedor pertenecen a `root` o a `www-data`. Si Laravel dice `The stream or file ".../storage/logs/laravel.log" could not be opened in append mode: Permission denied`:
     ```bash
     sudo chmod -R 777 backend/storage backend/bootstrap/cache
     ```

4. **Permisos de ejecución en el wrapper de Maven (`mvnw`):**
   - Si al ejecutar las pruebas o levantar Quarkus en Linux sale `./mvnw: Permission denied`:
     ```bash
     chmod +x quarkus/mvnw
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

7. **Error al cambiar de rama en Git (`maven-wrapper.jar` no se puede sobrescribir):**
   - Si al hacer `git checkout` sale error de que `quarkus/.mvn/wrapper/maven-wrapper.jar` no se puede desvincular o sobrescribir:
     ```bash
     git checkout -f <nombre-de-rama>
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

## 7. Pruebas unitarias (Quarkus y Mockito)

Para ejecutar las pruebas unitarias del microservicio Quarkus:

**Windows (PowerShell):**
```powershell
cd quarkus
.\mvnw.cmd test
```

**Linux / macOS (Bash):**
```bash
cd quarkus
./mvnw test
```

O directamente mediante Docker:
```bash
docker compose exec quarkus ./mvnw test
```

Estas pruebas utilizan Mockito (`AnalyticsResourceMockitoTest.java`) para aislar los servicios y validar los endpoints analíticos de predicción y métodos numéricos sin depender de base de datos ni servicios externos.

## 8. Logs y auditoría del sistema

Los logs se almacenan de manera independiente según el módulo:

- **Backend (Laravel):** dentro de la carpeta `backend/storage/logs/`:
  - `auth/`: inicios de sesión y autenticación.
  - `academico/`: asignaciones de aulas, paralelos y rotación docente.
  - `cajas/`: cobro de aranceles y transacciones.
  - `almacen/`: movimientos de inventario y pedidos de libros.
  - `api/`: llamadas y respuestas a los endpoints.
- **Quarkus:** en el archivo `quarkus/logs/quarkus.log`.
- **Auditoría en base de datos:** en la tabla `log_auditoria` de PostgreSQL.

Para ver los logs en tiempo real:

**Windows (PowerShell):**
```powershell
Get-Content backend\storage\logs\auth\auth.log -Wait -Tail 30
Get-Content quarkus\logs\quarkus.log -Wait -Tail 30
```

**Linux / macOS (Bash):**
```bash
tail -f backend/storage/logs/auth/auth.log
tail -f quarkus/logs/quarkus.log
```

## 9. Cuentas de prueba para los distintos roles

El sistema cuenta con las siguientes cuentas de prueba creadas en los seeders (se puede ingresar con cualquier contraseña de 4 o más caracteres, por ejemplo `1234`):

| Correo | Rol | Descripción y Alcance |
| :--- | :--- | :--- |
| `admin@ejercito.mil.bo` | ADMIN | Administrador general con acceso a todos los módulos y auditoría |
| `jefe.academico@ejercito.mil.bo` | JEFE_ACADEMICO | Jefe académico, apertura de paralelos y rotaciones docentes |
| `doc.rios@ejercito.mil.bo` | DOCENTE | Docente (solo ve sus propios paralelos y estudiantes asignados) |
| `cajero@ejercito.mil.bo` | CAJERO | Atención de ventanilla en cola FIFO y cobro de aranceles |
| `almacen@ejercito.mil.bo` | ALMACENERO | Control de inventario y entrega de libros de texto |
| `est.mamani@ejercito.mil.bo` | ESTUDIANTE | Estudiante (solo ve sus notas y su propio paralelo asignado) |

# Sistema de Gestión Académica — EIE

Sistema de la Escuela de Idiomas del Ejército (EIE). El proyecto se ejecuta mediante Docker Compose e incluye PostgreSQL, Laravel, Next.js y Quarkus.

---

## 👥 Equipo de Desarrollo y Asignación de Roles

A continuación se detalla el equipo de desarrollo, sus cuentas de GitHub, roles y responsabilidades en el proyecto:

| Integrante | Usuario de GitHub | Rol en el Proyecto | Rama Asignada | Responsabilidades y Módulos Principales |
| :--- | :--- | :--- | :---: | :--- |
| **Pablo Medina** | [@polikarmio-crypto](https://github.com/polikarmio-crypto) | **Project Lead & Frontend Architect** | [Pablo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Pablo) | Arquitectura frontend Next.js 14, UI/UX institucional con radar y escudo EIE, AppShell, diseño responsive y vistas core. |
| **Arturo Wilder Figueredo Sanjinés** | [@figueredosanjinesarturowilder-0708](https://github.com/figueredosanjinesarturowilder-0708) | **Backend Lead & Database Architect** | [Arturo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Arturo) | Backend API RESTful en Laravel 11, modelos Eloquent, migraciones y seeders relacionales PostgreSQL, controladores de catálogos y estructura académica. |
| **Ricardo** | [@RicardoS2225](https://github.com/RicardoS2225) | **Coordinador Financiero y Matrículas** | [Ricardo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Ricardo) | Módulos de inscripciones, control de aranceles, gestión de cobros/pagos, reportes administrativos y conciliación contable. |
| **André Candia** | [@AndreCandia0712](https://github.com/AndreCandia0712) | **Microservicios, Analítica & DevOps** | [Candia](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Candia) | Microservicio Quarkus (Java / RESTEasy), orquestación y networking Docker Compose, telemetría y métricas de rendimiento. |

---

## Requisitos

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

**Linux/macOS:**

```bash
cp .env.example .env
```

El archivo `docker-compose.yml` ya define valores predeterminados para `DB_USERNAME`, `DB_PASSWORD` y `NEXTAUTH_SECRET`. Para personalizarlos, configura estas variables en el `.env` de la raíz antes de iniciar los contenedores. No publiques contraseñas reales en Git.

Si el backend requiere `APP_KEY`, comprueba que esté configurada en su entorno. No se incluye un comando automático para generarla porque depende del Dockerfile y de la configuración efectiva de Laravel.

## 3. Iniciar el sistema

Abre Docker Desktop (si utilizas Windows). Desde la carpeta raíz del proyecto, ejecuta:

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

**Atención:** no utilices `migrate:fresh` sobre una base con información que quieras conservar, porque elimina las tablas antes de recrearlas.

El archivo `docker/postgres/init.sql` está montado para ejecutarse al inicializar un volumen PostgreSQL vacío; no se vuelve a ejecutar automáticamente en cada arranque.

## 5. Abrir la aplicación

| Servicio | Dirección desde el equipo |
| --- | --- |
| Aplicación web (Next.js) | http://localhost:3000 |
| API Laravel | http://localhost:8000 |
| Microservicio Quarkus | http://localhost:8080 |
| PostgreSQL | `localhost:5433` (conexión desde cliente de base de datos) |

Dentro de la red Docker, Laravel y Quarkus se conectan a PostgreSQL usando el host `postgres` y el puerto `5432`.

## 6. Comandos útiles

```bash
# Ver contenedores
docker compose ps

# Consultar registros
docker compose logs -f

# Ver solo los registros de un servicio
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Reconstruir e iniciar después de cambios en Dockerfiles
docker compose up -d --build

# Detener y eliminar contenedores (conserva los volúmenes)
docker compose down
```

Para limpiar cachés de Laravel:

```bash
docker compose exec backend php artisan optimize:clear
```

Para eliminar también los volúmenes de datos, existe `docker compose down -v`, pero **borra el volumen persistente de PostgreSQL** y los demás volúmenes declarados. No lo ejecutes si necesitas conservar los datos.

## Problemas frecuentes

**No abre `localhost:3000`:** revisa `docker compose ps` y `docker compose logs -f frontend`.

**El backend no conecta a PostgreSQL:** comprueba que `postgres` esté saludable y que las credenciales de ambos servicios coincidan. Si ya existe el volumen `pgdata`, cambiar `DB_PASSWORD` no modifica automáticamente la contraseña del usuario creado anteriormente.

**Un contenedor no inicia:** consulta sus registros con `docker compose logs --tail=100 NOMBRE_SERVICIO`.

**Un puerto está ocupado:** libera el puerto o ajusta su publicación en `docker-compose.yml`.

> Esta guía corresponde a los servicios definidos en el `docker-compose.yml` compartido. Para que el arranque funcione, deben existir los Dockerfiles de `backend/`, `frontend/` y `quarkus/`, además del archivo `docker/postgres/init.sql` montado por Compose.

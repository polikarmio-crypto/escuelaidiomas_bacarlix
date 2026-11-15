# Sistema de Gestión Académica y Control Administrativo (SACA) — EIE

Sistema integral de la **Escuela de Idiomas del Ejército (EIE)**. La plataforma está orquestada mediante Docker Compose y se compone de una arquitectura distribuida basada en microservicios: **PostgreSQL 16**, **Laravel 11 (API RESTful)**, **Next.js 14 (Frontend Institucional)** y **Quarkus 3.15 (Microservicio Reactivo de Analítica y Modelos Numéricos)**.

---

## 👥 Equipo de Desarrollo y Asignación de Roles

A continuación se detalla el equipo de desarrollo, sus cuentas de GitHub, roles y responsabilidades en el proyecto:

| Integrante | Usuario de GitHub | Rol en el Proyecto | Rama Asignada | Responsabilidades y Módulos Principales |
| :--- | :--- | :--- | :---: | :--- |
| **Pablo Luis Medina Oroz** | [@polikarmio-crypto](https://github.com/polikarmio-crypto) | **Arquitectura Frontend, Seguridad de Acceso y Subsistema de Auditoría** | [Pablo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Pablo) | Arquitectura frontend en Next.js 14, UI/UX institucional con radar táctico, escudo oficial EIE y soporte temático Claro/Oscuro. AppShell centralizado, navegación protegida por roles, seguridad estricta de vistas (aislamiento individual para que estudiantes y docentes solo vean su propia información), blindaje de Google Auth (desactivación del recuerdo automático de credenciales con `select_account`) y diseño e implementación del **Subsistema de Logs por Módulo** (`storage/logs/{auth, almacen, academico, cajas, api}`) y la tabla de auditoría `log_auditoria`. |
| **Arturo Wilder Figueredo Sanjinés** | [@figueredosanjinesarturowilder-0708](https://github.com/figueredosanjinesarturowilder-0708) | **Arquitectura Backend, Base de Datos y Gestión Académica** | [Arturo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Arturo) | Backend API RESTful en Laravel 11, modelos Eloquent relacionales, migraciones en 5ta Forma Normal (5FN) y seeders completos en PostgreSQL. Triggers PL/pgSQL, particiones y soft deletes. Módulo académico integral (Idiomas, Programas, Niveles, Paralelos y Aulas), **sistema de rotación masiva automática de docentes** basada en especialidad lingüística y balanceo de carga lectiva, y filtrado dinámico estricto por idioma en la asignación de docentes y estudiantes a paralelos. |
| **Ricardo Alexander Siles Rivero** | [@RicardoS2225](https://github.com/RicardoS2225) | **Módulo de Cajas, Recaudaciones, Almacén de Libros y Pruebas Unitarias** | [Ricardo](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Ricardo) | Módulo de Cajas y Recaudaciones con transacciones ACID y cola FIFO contra condiciones de carrera (*race conditions*), cobro de aranceles y fichas de atención. Módulo de Almacén de Libros con cálculo de punto de reorden (ROP), inventarios y reposición de stock. Módulo de Calificaciones y actas de notas. Implementación de **pruebas unitarias con Mockito** en Quarkus (`AnalyticsResourceMockitoTest`) con cobertura de endpoints analíticos y configuración de logging en archivo (`quarkus/logs/quarkus.log`). |
| **Andre Sebastian Candia Ortiz** | [@AndreCandia0712](https://github.com/AndreCandia0712) | **Control de Asistencia, Modelos Numéricos y Microservicio Quarkus** | [Candia](https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix/tree/Candia) | Módulo de Control Diario de Asistencia y generador de reportes oficiales en PDF con formato institucional de control militar. Modelos matemáticos de predicción H3: **Regresión de Mínimos Cuadrados** (predicción de notas y retención estudiantil), **Programación Lineal Simplex** (optimización de ocupación de aulas) y **Teoría de Colas Erlang-C** (dimensionamiento de ventanillas de cajas). Microservicio reactivo Quarkus (REST Jackson, Vert.x, SmallRye Context Propagation) y orquestación integral en Docker Compose. |

---

## 🏛️ Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   APLICACIÓN WEB (Next.js 14)                          │
│               http://localhost:3000 • Puerto 3000                      │
│   Landing Page Oficial • SACA Dashboard • Control por Roles y Permisos  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ REST API                       │ REST API
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       BACKEND API (Laravel 11)       │  │  MICROSERVICIO (Quarkus 3)   │
│         http://localhost:8000        │  │    http://localhost:8080     │
│   Auth, Académico, Cajas, Almacén,   │  │   Analítica H3, Simplex,     │
│   Calificaciones, Asistencia, Logs   │  │   Erlang-C, Mínimos Cuadrados │
└───────────────────┬──────────────────┘  └──────────────┬───────────────┘
                    │                                    │
                    │               PostgreSQL 16        │
                    └────────────────► ◄─────────────────┘
                                Puerto 5433 (host)
                                Puerto 5432 (red Docker)
```

---

## 🚀 Guía Rápida para Levantar el Sistema con Docker Compose (Recomendado)

### Prerrequisitos
- **Git** instalado.
- **Docker Desktop** (en Windows) con motor WSL 2 activo, o **Docker Engine + Docker Compose** (en Linux).

> **Nota:** No es obligatorio tener instalados localmente PHP, Node.js, Java ni Composer; cada componente se compila y ejecuta dentro de su propio contenedor aislado.

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix.git
cd escuelaidiomas_bacarlix
```

---

### Paso 2: Configurar las Variables de Entorno

Crear el archivo `.env` en la raíz copiando la plantilla base:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS (Bash):**
```bash
cp .env.example .env
```

*(Opcional: Si se desea personalizar contraseñas de PostgreSQL o llaves de NextAuth, editarlas dentro del archivo `.env`).*

---

### Paso 3: Iniciar los Contenedores

Desde la raíz del proyecto, ejecutar:

```bash
docker compose up -d --build
```

Este comando levantará los cuatro servicios:
1. `postgres` (Base de datos relacional PostgreSQL 16)
2. `backend` (API Laravel 11 con PHP 8.2)
3. `quarkus` (Microservicio analítico reactivo en JVM)
4. `frontend` (Aplicación Next.js 14 en modo desarrollo)

Verificar que los contenedores estén en estado `Up`:
```bash
docker compose ps
```

---

### Paso 4: Ejecutar Migraciones y Datos Iniciales (Seeders)

Una vez que los contenedores estén levantados, ejecutar las migraciones de base de datos y la carga inicial de catálogos, docentes, estudiantes y usuarios:

```bash
# Ejecutar migraciones 5FN y triggers
docker compose exec backend php artisan migrate --force

# Poblar con datos institucionales (Seeders)
docker compose exec backend php artisan db:seed --force
```

Generar el enlace simbólico de almacenamiento público de Laravel si es necesario:
```bash
docker compose exec backend php artisan storage:link
```

---

### Paso 5: Acceder a los Servicios

| Servicio | URL / Endpoint | Descripción |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:3000](http://localhost:3000) | Landing page, Portal de Acceso y Sistema SACA |
| **Backend API REST** | [http://localhost:8000](http://localhost:8000) | Endpoints de Laravel (`/api/v1/...`) |
| **Microservicio Quarkus** | [http://localhost:8080](http://localhost:8080) | Endpoints de analítica (`/api/analytics/...`) |
| **Base de Datos PostgreSQL** | `localhost:5433` | Acceso externo para DBeaver, pgAdmin o DataGrip |

> **Credenciales de Base de Datos para DBeaver / pgAdmin:**
> - **Host:** `localhost`
> - **Puerto:** `5433`
> - **Base de datos:** `escuela_idiomas`
> - **Usuario:** `postgres`
> - **Contraseña:** `postgres123`

---

## 💻 Guía Alternativa: Levantamiento Local (Sin Docker)

Si se desea ejecutar los componentes directamente en la máquina host de desarrollo:

### Prerrequisitos Locales:
- **PHP 8.2+** con extensiones: `pdo_pgsql`, `pgsql`, `mbstring`, `openssl`, `curl`.
- **Composer** 2.x.
- **Node.js 18+** ó **20+** y `npm`.
- **Java JDK 21+** ó **25** y soporte de Maven (`mvnw` incluido).
- **PostgreSQL 16** instalado y corriendo localmente en el puerto `5432`.

### 1. Backend Laravel:
```bash
cd backend
composer install
Copy-Item .env.example .env    # En Linux: cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 2. Frontend Next.js:
```bash
cd frontend
npm install
npm run dev -- -p 3000
```

### 3. Microservicio Quarkus:
```bash
cd quarkus
# En Windows:
.\mvnw.cmd quarkus:dev
# En Linux:
./mvnw quarkus:dev
```

---

## 🧪 Pruebas Unitarias con Mockito (Quarkus)

El microservicio Quarkus incluye una suite de pruebas unitarias implementada con **Mockito** (`quarkus-junit5-mockito`):

- **Archivo de pruebas:** `quarkus/src/test/java/bo/mil/ejercito/idiomas/resource/AnalyticsResourceMockitoTest.java`
- **Componentes probados con Mocks (`@InjectMock`):**
  - `PrediccionRendimientoService`: Simulación de regresiones lineales y clasificación de riesgo sin invocar base de datos ni servicios externos.
  - `MetodosNumericosService`: Simulación de cálculo Simplex y teoría de colas Erlang-C.
  - Endpoints REST `/api/analytics/*` verificando códigos de estado HTTP 200, contratos JSON y manejo de errores.

### Comando para ejecutar las pruebas unitarias:

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

**Vía Docker:**
```bash
docker compose exec quarkus ./mvnw test
```

*Resultado esperado:*
```text
[INFO] Results:
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 📋 Subsistema de Logs y Monitoreo del Sistema

El sistema implementa dos capas de logging para garantizar trazabilidad y auditoría:

### 1. Directorios de Almacenamiento de Logs
- **Laravel (Logs segregados por módulo):**
  - `backend/storage/logs/auth/`: Intentos de login, accesos por Google Auth y cierres de sesión.
  - `backend/storage/logs/academico/`: Rotaciones docentes automáticas, asignación de aulas y paralelos.
  - `backend/storage/logs/cajas/`: Emisión de fichas de atención, cobro de aranceles y transacciones FIFO.
  - `backend/storage/logs/almacen/`: Entradas/salidas de inventario de textos y cálculo ROP.
  - `backend/storage/logs/api/`: Peticiones REST, payloads y códigos de respuesta.
- **Quarkus:**
  - `quarkus/logs/quarkus.log`: Registro de ejecuciones de modelos matemáticos y peticiones REST analíticas.
- **Auditoría en Base de Datos:**
  - Tabla `log_auditoria`: Registra usuario, rol, IP de origen, entidad afectada, payload previo y posterior con marca de tiempo precisa.

### 2. Comandos para Monitorear Logs en Tiempo Real

**En Windows (PowerShell):**
```powershell
# Monitorear logs de autenticación
Get-Content backend\storage\logs\auth\auth.log -Wait -Tail 30

# Monitorear logs de rotación académica
Get-Content backend\storage\logs\academico\academico.log -Wait -Tail 30

# Monitorear logs de Quarkus
Get-Content quarkus\logs\quarkus.log -Wait -Tail 30
```

**En Linux / macOS (Bash):**
```bash
tail -f backend/storage/logs/auth/auth.log
tail -f quarkus/logs/quarkus.log
```

**Desde Contenedores Docker:**
```bash
docker compose logs -f backend
docker compose logs -f quarkus
docker compose logs -f frontend
```

---

## 🔐 Cuentas Institucionales y Roles de Acceso (Demo)

El sistema cuenta con cuentas iniciales preconfiguradas para pruebas inmediatas según el perfil de usuario. Puede ingresarse cualquier contraseña de 4 o más caracteres (ej: `1234` o `admin123`):

| Correo Institucional | Nombre Completo | Rol Asignado | Alcance de Visualización y Permisos |
| :--- | :--- | :--- | :--- |
| `admin@ejercito.mil.bo` | Cnl. DAEN. Roberto Méndez Silva | **ADMIN** | Acceso total al sistema, auditoría, dashboard y gestión global. |
| `jefe.academico@ejercito.mil.bo` | Tcnl. DEM. Hugo Banzer Rivera | **JEFE_ACADEMICO** | Apertura de paralelos, rotación docente automática y gestión de aulas. |
| `doc.rios@ejercito.mil.bo` | Prof. Fernando Ríos Torrico | **DOCENTE** | **Vista aislada:** Únicamente visualiza sus paralelos asignados y alumnos a su cargo. |
| `cajero@ejercito.mil.bo` | Sof. My. David Choquehuanca | **CAJERO** | Ventanilla de atención FIFO, cobro de matrículas y arqueo de caja. |
| `almacen@ejercito.mil.bo` | Sgto. 2do. Marcelo Justiniano | **ALMACENERO** | Inventario de textos de idiomas, pedidos de reposición y entregas. |
| `est.mamani@ejercito.mil.bo` | Cad. Carlos Fernando Mamani | **ESTUDIANTE** | **Vista aislada:** Únicamente visualiza su propio paralelo, notas y asistencia personal. |

> **Políticas de Seguridad Implementadas:**
> 1. **Aislamiento Estricto por ID:** Los usuarios con rol `ESTUDIANTE` y `DOCENTE` tienen vistas parametrizadas para no acceder bajo ninguna circunstancia a registros o asignaciones de otros usuarios de su mismo rol.
> 2. **Cero Persistencia de Cuentas en Google Auth:** La autenticación federada implementa `prompt: "select_account"`, impidiendo que el navegador recuerde la última cuenta iniciada para evitar accesos cruzados no autorizados en terminales compartidas.

---

## 🛠️ Guía de Solución de Errores Frecuentes

### 1. Para Desarrolladores en Windows
- **Conflicto de Puertos (3000, 8000, 5433):**
  Si un puerto está ocupado por otro servicio local:
  ```powershell
  Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
  # Matar el proceso por su PID
  Stop-Process -Id <PID> -Force
  ```
- **Fallo de Saltos de Línea (CRLF vs LF):**
  Si Docker reporta `^M: bad interpreter`, configurar Git para evitar conversiones automáticas:
  ```powershell
  git config --global core.autocrlf input
  ```
- **Actualizar WSL 2:**
  ```powershell
  wsl --update
  wsl --set-default-version 2
  ```

### 2. Para Desarrolladores en Linux (Ubuntu / Debian / Arch / CachyOS)
- **Permisos de Docker sin `sudo`:**
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```
- **Permisos de escritura en carpetas de Laravel:**
  ```bash
  sudo chmod -R 777 backend/storage backend/bootstrap/cache
  ```
- **Habilitar el servicio Docker:**
  ```bash
  sudo systemctl enable --now docker
  ```

---

## 🧰 Comandos Útiles de Mantenimiento

```bash
# Ver estado y consumo de los contenedores
docker compose ps

# Reiniciar todos los servicios
docker compose restart

# Reconstruir imágenes tras cambios de dependencias
docker compose up -d --build

# Limpiar caché de Laravel dentro del contenedor
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan route:clear

# Detener los contenedores conservando los datos de PostgreSQL
docker compose down
```

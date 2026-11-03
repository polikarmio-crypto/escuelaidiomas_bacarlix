# 🏛️ Sistema Académico y de Control Administrativo (SACA)
## Escuela de Idiomas del Ejército (EIE) — Fuerzas Armadas de Bolivia

> **Comando de Educación y Doctrina Militar (CEDMIL)**  
> *"Think Globally, Act Locally — Líderes en la Enseñanza de Idiomas Nativos y Extranjeros"*

Plataforma institucional integral para la administración académica, control financiero en ventanilla bajo disciplina FIFO, gestión de almacén con control de punto de reorden (ROP), analítica matemática e investigación operativa para la **Escuela de Idiomas del Ejército de Bolivia**.

---

## 👥 Equipo de Desarrollo y Distribución de Responsabilidades

El proyecto fue desarrollado bajo una arquitectura modular de 3 capas distribuida de forma técnica y equitativa entre los cuatro integrantes del equipo:

| Integrante | Rol en el Proyecto | Rama Git Asignada | Módulos & Responsabilidades Técnicas | Tecnologías Clave |
|---|---|---|---|---|
| **Pablo Medina** | **Lead Architect & Frontend Core** | `Pablo` | • Arquitectura general del sistema y `AppShell` institucional.<br>• Landing Page comercial (`/`) con Misión, Visión, carrusel, filiales, preinscripción y solicitud de correo.<br>• Dashboard central SACA (`/dashboard`) y control multi-rol.<br>• Módulo 1 (Catálogos Base) y Módulo 2 (Estructura Académica).<br>• Sistema de diseño, motor de temas Claro/Oscuro/Contraste y cortinas militares. | Next.js 14, React 18, Tailwind CSS, TypeScript, NextAuth.js |
| **Arturo** | **Backend Lead & DB Architect** | `Arturo` | • Diseño y normalización de la Base de Datos a 5FN en PostgreSQL.<br>• 11 migraciones DDL con índices parciales y triggers PL/pgSQL.<br>• API REST Laravel: `EstudianteController`, `DocenteController`, `ParaleloController`, `InscripcionController`.<br>• Reglas de negocio militares: Rotación quincenal de docentes (≤15 días) y expediente civil vs militar.<br>• Vistas frontend: `/estudiantes`, `/docentes`, `/paralelos`, `/inscripciones`. | Laravel 12, PHP 8.2 FPM, PostgreSQL 16, Eloquent ORM |
| **Ricardo** | **Financial & Operations Lead** | `Ricardo` | • Módulo 8: Cajas y Recaudaciones con cola FIFO y llamada de turnos (`CajaPagoController`, vista `/cajas`).<br>• Módulo 9: Almacén de Textos Oficiales ALC, inventario y control ROP (`AlmacenController`, vista `/almacen`).<br>• Módulo 7: Calificaciones bajo Ponderación Militar 80/10/10 (`CalificacionController`, vista `/calificaciones`).<br>• Modelos financieros y kardex físico de movimientos. | Laravel 12, PostgreSQL 16, Tailwind CSS, UI FIFO / ROP |
| **Candia** | **Microservices, Analytics & DevOps** | `Candia` | • Microservicio en Java 17 / Quarkus (`quarkus/`): endpoints `/api/analytics/*`.<br>• Implementación estricta de Investigación Operativa H3: Regresión Mínimos Cuadrados, Simplex, Interpolación de Newton y validación oficial Tabla 5.3.<br>• Teoría de Colas M/M/c con fórmula de Erlang-C.<br>• Vista frontend de Analítica (`/metodos-numericos`).<br>• Orquestación Docker Compose, Dockerfiles y scripts de despliegue (`setup.bat`, `setup.sh`). | Java 17+, Quarkus REST, Apache Maven, Docker Compose |

---

## 📐 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND WEB (Next.js 14 + React 18)               │
│                 TypeScript, Tailwind CSS, NextAuth.js                  │
│                              Puerto: 3000                              │
└───────────────────▲─────────────────────────────────▲───────────────────┘
                    │                                 │
                    │ REST API                        │ REST API
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│       BACKEND CORE (Laravel 12)       │ │  MICROSERVICIO IO (Quarkus)   │
│   PHP 8.2 FPM, Eloquent ORM, Sanctum  │ │     Java 17+, Quarkus REST    │
│   Reglas de Negocio, FIFO, Almacén    │ │ Teoría Colas M/M/c, Métodos   │
│              Puerto: 8000             │ │ Numéricos    Puerto: 8080     │
└───────────────────▲───────────────────┘ └───────────────▲───────────────┘
                    │                                     │
                    │ SQL / PDO                           │ JDBC
                    ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (PostgreSQL 16)                       │
│            Normalizada hasta 5FN, Extensiones pg_trgm, UUID             │
│            Índices Parciales, Vistas Materializadas y Triggers         │
│                              Puerto: 5432                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Requisitos Previos

Antes de ejecutar el sistema, asegúrate de tener instalado en tu equipo:

| Herramienta | Versión Mínima | Uso en el Sistema |
|---|---|---|
| **Docker Desktop** | 4.x+ (con Docker Compose v2) | Contenedor de PostgreSQL 16 y Backend Laravel 12 |
| **Node.js** | 18.x+ (LTS recomendado 20.x) | Ejecución del Frontend Next.js |
| **npm** | 9.x+ | Gestor de dependencias del frontend |
| **Java JDK** | 17+ (probado con JDK 21 / 25) | Microservicio de Analítica Quarkus |
| **Apache Maven** | 3.9+ | Compilación y ejecución de Quarkus (`mvn`) |
| **Git** | 2.x+ | Control de versiones |

> 💡 **Nota importante:** El backend Laravel corre 100% dentro de un contenedor Docker que ya incluye PHP 8.2-FPM, extensiones PostgreSQL (`pdo_pgsql`) y Composer. **No necesitas tener PHP ni Composer instalados en tu máquina anfitriona**.

---

## 🚀 Guía Paso a Paso para Ejecutar el Proyecto

### Paso 1: Clonar el Repositorio

Abre tu terminal (PowerShell en Windows o Bash en Linux/macOS) y clona el proyecto:

```powershell
git clone https://github.com/polikarmio-crypto/escuelaidiomas_bacarlix.git
cd escuelaidiomas_bacarlix
```

*(Si ya tienes la carpeta abierta, sitúate en la raíz del proyecto).*

---

### Paso 2: Configurar las Variables de Entorno

Copia el archivo de configuración base tanto para el entorno general como para el frontend:

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env.local
```

**En Linux / macOS:**
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

---

### Paso 3: Iniciar PostgreSQL y Backend con Docker

Levanta los contenedores de la base de datos y del backend en segundo plano:

```powershell
docker compose up -d postgres backend
```

Verifica que ambos contenedores estén activos y saludables:

```powershell
docker compose ps
```

Deberás observar:
- `eie_postgres` en el puerto `5432` (Estado: `Up (healthy)`)
- `eie_backend` en el puerto `8000` (Estado: `Up`)

---

### Paso 4: Ejecutar Migraciones y Carga Inicial de Datos (Seeders)

Ejecuta el siguiente comando dentro del contenedor de Laravel para estructurar la base de datos y poblarla con más de 450 registros de prueba (estudiantes, docentes, paralelos, notas, inventario de libros y cajas):

```powershell
docker compose exec backend php artisan migrate:fresh --seed
```

> **Verificación del Backend:**  
> Puedes comprobar que la API responde ingresando en tu navegador a:  
> `http://localhost:8000/api/v1/health`  
> O mediante terminal:
> ```powershell
> curl http://localhost:8000/api/v1/health
> ```
> Deberá responder: `{"status":"OK","service":"Escuela de Idiomas del Ejército - API", ...}`

---

### Paso 5: Instalar y Levantar el Frontend (Next.js)

Abre una **segunda pestaña o ventana de terminal**:

```powershell
cd frontend
npm install
npm run dev
```

El portal estará disponible inmediatamente en tu navegador:
🌐 **http://localhost:3000**

- **Ruta `/`**: Landing Page institucional con Misión, Visión, oferta de 36 libros ALC, 9 filiales, preinscripción online y solicitud de correo institucional `@idiomas.ejercito.mil.bo`.
- **Ruta `/dashboard`**: Plataforma académica SACA para ingreso de usuarios autorizados.

---

### Paso 6: Levantar el Microservicio Quarkus (Analítica y Métodos Numéricos)

Abre una **tercera pestaña de terminal** para iniciar el motor matemático:

```powershell
cd quarkus
mvn quarkus:dev
```

El microservicio estará disponible en:
🌐 **http://localhost:8080**  
- Validación H3: `http://localhost:8080/api/analytics/prediccion-rendimiento/validacion-h3`

---

## 🔑 Cuentas de Acceso y Roles Institucionales (Modo Demo)

El sistema cuenta con un conmutador de roles en el encabezado y en el modal de login. Para ingresar a cualquiera de los roles, pulsa en **"Ingreso con Email Institucional"** o usa las siguientes credenciales:

| Rol Institucional | Email Institucional | PIN de Seguridad | Módulos y Funciones Habilitadas |
|---|---|:---:|---|
| 🔴 **Administrador del Sistema** | `admin@ejercito.mil.bo` | `9999` | **Módulo 1: Catálogos Base** (`/catalogos`), Dashboard global, auditoría y control de usuarios. |
| 🔵 **Jefe Académico** | `jefe.academico@ejercito.mil.bo` | `5050` | **Módulos 2 al 6:** Estructura Académica (`/estructura`), Docentes y Rotación (`/docentes`), Estudiantes (`/estudiantes`), Paralelos (`/paralelos`), Inscripciones (`/inscripciones`), Supervisión de Notas (`/calificaciones`) y Analítica H3 (`/metodos-numericos`). |
| 🟢 **Docente Catedrático** | `doc.rios@ejercito.mil.bo` | `1010` | **Módulo 5:** Mis Paralelos asignados.<br>**Módulo 7:** Registro de notas por libro bajo fórmula militar 80/10/10. |
| 🟡 **Cajero / Ventanilla** | `cajero@ejercito.mil.bo` | `3030` | **Módulo 8: Cajas y Recaudaciones** (`/cajas`) — Atención por orden FIFO, llamada de turnos, cobro de matrículas y emisión de boletas. |
| 🩷 **Encargado de Almacén** | `almacen@ejercito.mil.bo` | `4040` | **Módulo 9: Almacén de Libros** (`/almacen`) — Control de stock ALC, kardex de entregas, punto de reorden (ROP) y reposición. |
| 🔷 **Estudiante (Civil / Militar)** | `est.mamani@ejercito.mil.bo` | *(Sin PIN)* | Consulta de cursos inscritos, avance libro a libro, notas acumuladas y solicitud de ficha de atención digital para ventanilla. |

---

## 🎖️ Reglas de Negocio Militares y Académicas Implementadas

1. **Rotación Docente Quincenal (≤ 15 días):**  
   Por doctrina militar pedagógica, ningún docente imparte clases de forma ininterrumpida por más de 15 días a un mismo paralelo, garantizando la adaptación fonética del estudiante. El sistema emite alertas automáticas en `GET /api/v1/docentes/alertas/rotacion`.

2. **Evaluación Ponderada Militar (Fórmula 80 / 10 / 10):**  
   - **Examen Teórico / Práctico Escrito:** 80%  
   - **Defensa Oral (Speaking):** 10%  
   - **Participación y Disciplina en Aula:** 10%  
   - **Nota Mínima de Aprobación:** **71.0 / 100 puntos**. Si la nota es inferior a 71, el estudiante no es promovido al siguiente libro.

3. **Subtipo de Estudiantes:**  
   - **Civil:** C.I., expedido, contacto particular y arancel regular.  
   - **Militar:** Registro de Grado Militar, Unidad Militar de destino y Código de Escalafón.

4. **Disciplina FIFO en Cajas (First In, First Out):**  
   Las fichas de turno se encolan con marca de tiempo precisa. No se atiende fuera de orden cronológico.

5. **Punto de Reorden en Almacén (ROP):**  
   Alerta automática cuando el inventario físico de un libro ALC desciende por debajo del stock mínimo calculado por la demanda del paralelo.

---

## 📊 Métodos Numéricos & Investigación Operativa (H3)

Siguiendo el pliego de especificaciones **H3 - Proyecto Semestral de Métodos Numéricos e Investigación Operativa**:

| Método | Base Matemática | Aplicación Práctica en la EIE |
|---|---|---|
| **Predicción de Rendimiento H3** | Mínimos Cuadrados $\hat{y} = ax + b$ proyectado a exámenes de nivel $x_p \in \{6, 12, 18, 24, 30, 36\}$ | Clasificación preventiva de riesgo de deserción en tres niveles: **ALTO** ($\hat{y} < 51$), **MEDIO** ($51 \le \hat{y} < 65$) y **BAJO** ($\hat{y} \ge 65$). |
| **Validación Oficial H3 (Tabla 5.3)** | Datos de entrada: `{78, 74, 75, 68, 66, 61}` | Coeficientes exactos: $a \approx -3.314$, $b \approx 81.933$, $R^2 \approx 0.936$. Proyección libro 12: $\hat{y}_{12} = 42.16$ (Alerta de Riesgo Alto). |
| **Interpolación de Newton** | Polinomio de diferencias divididas | Estimación de calificaciones intermedias sin presuponer linealidad. |
| **Programación Lineal Simplex** | Algoritmo Simplex primal maximizador con variables de holgura | Asignación óptima de carga horaria en laboratorios y aulas climatizadas. |
| **Teoría de Colas M/M/c** | Distribución de Poisson y tiempos de servicio exponenciales con fórmula C de Erlang | Dimensionamiento óptimo de ventanillas de cobro en periodo de matriculación. |

---

## 🛠️ Comandos de Mantenimiento Frecuentes

### Docker y Base de Datos

```powershell
# Ver estado de los contenedores
docker compose ps

# Ver registros en tiempo real del backend
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Detener los contenedores
docker compose down

# Reconstruir contenedores si se modifica un Dockerfile
docker compose up -d --build postgres backend
```

### Laravel Artisan (Dentro del Contenedor)

```powershell
# Resetear base de datos completa con seeders
docker compose exec backend php artisan migrate:fresh --seed

# Limpiar cachés de configuración y rutas
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan route:clear
```

### Frontend (Next.js)

```powershell
# Compilar frontend para producción y verificar tipos TypeScript
npm run build

# Ejecutar el servidor de producción compilado
npm run start
```

---

## 🗂️ Estructura del Directorio del Proyecto

```
proyecto_Idiomas/
├── backend/                     # API REST Laravel 12 (PHP 8.2 FPM)
│   ├── app/Http/Controllers/Api/  # 12 Controladores REST
│   ├── app/Models/                # 28 Modelos de dominio Eloquent
│   ├── database/migrations/       # 11 Migraciones DDL en 5FN
│   ├── database/seeders/          # Poblado de 450+ registros
│   └── routes/api.php             # Definición de rutas /api/v1
├── frontend/                    # Portal Web Next.js 14 (App Router)
│   ├── public/                    # Logotipos oficiales e imágenes
│   │   ├── images/logos/logo-eie.png
│   │   └── images/carousel/       # Banners de la Landing Page
│   ├── src/app/                   # 16 Rutas y vistas completas
│   │   ├── page.tsx               # Landing Page comercial institucional
│   │   ├── dashboard/             # Panel de control de roles SACA
│   │   ├── estudiantes/           # Módulo 4: CRUD Estudiantes
│   │   ├── docentes/              # Módulo 3: CRUD Docentes y Rotación
│   │   ├── paralelos/             # Módulo 5: Paralelos y Asignaciones
│   │   ├── inscripciones/         # Módulo 6: Matriculación
│   │   ├── calificaciones/        # Módulo 7: Ponderación 80/10/10
│   │   ├── cajas/                 # Módulo 8: Turnos FIFO y Pagos
│   │   ├── almacen/               # Módulo 9: Kardex y ROP
│   │   └── metodos-numericos/     # Suite de Investigación Operativa
│   └── src/components/            # AppShell con temas y animaciones
├── quarkus/                     # Microservicio Java 17+ (Quarkus REST)
│   ├── src/main/java/.../service/ # Servicios matemáticos e IO
│   └── src/test/java/.../         # Tests unitarios H3
├── docker-compose.yml           # Orquestación de contenedores
├── setup.bat                    # Script de inicialización Windows
└── README.md                    # Documentación técnica integral
```

---

## 📄 Licencia y Derechos

Desarrollado para la **Escuela de Idiomas del Ejército (EIE)** bajo la tuición del **Comando de Educación y Doctrina Militar (CEDMIL)**, Estado Plurinacional de Bolivia.

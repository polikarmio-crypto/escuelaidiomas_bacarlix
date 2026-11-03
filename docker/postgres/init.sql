-- ===============================================================================
-- Script de inicialización PostgreSQL
-- Sistema de Gestión Académica - Escuela de Idiomas del Ejército (EIE)
-- ===============================================================================
-- Este script se ejecuta automáticamente al crear el contenedor por primera vez.
-- Configura extensiones, locale, y optimizaciones para la BD.
-- ===============================================================================

-- Habilitar extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Búsqueda de texto por trigrams (ILIKE performante)
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Índices GIN para búsquedas de texto

-- Configurar timezone para Bolivia
SET timezone = 'America/La_Paz';

-- Crear esquema de auditoría (para futura implementación)
CREATE SCHEMA IF NOT EXISTS auditoria;

COMMENT ON DATABASE escuela_idiomas IS 'Base de datos del Sistema de Gestión Académica de la Escuela de Idiomas del Ejército (EIE) - Normalizada hasta 5FN';

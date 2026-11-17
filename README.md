# Futsal Club — Sistema de Gestión de Planteles

Aplicación web para que el cuerpo técnico, el cuerpo médico y los dirigentes de un club de futsal gestionen los planteles de las **7 divisiones** (octava a primera): datos de los jugadores, **apto físico anual**, estadísticas, **suspensiones** y **convocatorias a partidos**, con reglas de negocio reales (28 reglas numeradas en [`docs/SPEC.md`](docs/SPEC.md)).

Proyecto final de **Generación T** — Valentino Tropea Varotrelli, ETN N°35.

## Probar la aplicación publicada

| | |
|---|---|
| Aplicación (frontend) | **COMPLETAR: link de Netlify, por ejemplo https://futsal-club.netlify.app** |
| API (backend) | **COMPLETAR: link de Render, por ejemplo https://futsal-club-api.onrender.com** |
| Usuarios de prueba | admin@futsalclub.com, tecnico@futsalclub.com, medico@futsalclub.com |
| Contraseñas | **COMPLETAR: se entregan junto con el link en el campus (no se escriben en el repositorio)** |

> El backend está en un plan gratuito: si estuvo inactivo, la primera respuesta puede tardar hasta un minuto. Conviene abrir primero `/api/health` del backend.

## Qué hace

- **Ingreso con tres roles:** administrador, técnico y médico, cada uno con sus permisos.
- **Plantel por división:** tabla con edad, altura, peso, estado del apto físico, estadísticas y suspensión; búsqueda por nombre y filtro por estado del apto.
- **Apto físico anual:** `apto`, `vencido` (cargado en un año anterior) o `no_apto`. Solo lo cargan el médico y el administrador.
- **Estadísticas y suspensiones:** goles, amarillas, rojas y asistencias solo se suman; una roja o la quinta amarilla suspenden automáticamente al jugador.
- **Partidos y convocatorias:** máximo 14 convocados, solo jugadores de la división, con apto vigente, sin suspensión y sin otro partido el mismo día. Convocar es todo o nada.
- **Resumen por división** con aptos, vencidos, suspendidos y los 3 máximos goleadores.

## Tecnología

| Parte | Tecnología |
|---|---|
| Frontend | HTML, CSS (Bootstrap 5) y JavaScript sin framework — Netlify |
| Backend | Node.js 20+ con Express, arquitectura Routes → Controller → Service → Repository — Render |
| Base de datos | PostgreSQL — Neon |
| Seguridad | Sesiones con JWT (8 h), contraseñas con bcrypt, consultas SQL parametrizadas |
| Pruebas | `node --test`, `pg-mem` (PostgreSQL en memoria) y `jsdom` |

## Cómo correrlo en tu computadora

Necesitás Node.js 20 o superior.

**Opción rápida (sin base de datos):**

```bash
cd backend
npm install
npm run dev:memoria
```

Abrí http://localhost:3000. La consola muestra la contraseña de esa sesión. Los datos se pierden al cerrar.

**Opción completa (con PostgreSQL):**

```bash
cd backend
npm install
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm run db:init             # crea las tablas
DEMO=true npm run db:seed   # crea los usuarios y datos de ejemplo
SERVE_FRONTEND=true npm start
```

## Pruebas

```bash
cd backend
npm test            # 75 pruebas
npm run informe     # corre todo y regenera docs/INFORME_PRUEBAS.md
```

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | Especificación con las reglas de negocio numeradas (RN-01 a RN-28) |
| [`docs/PLAN.md`](docs/PLAN.md) | Plan de trabajo: las 11 tareas, todas hechas |
| [`docs/INFORME_PRUEBAS.md`](docs/INFORME_PRUEBAS.md) | Informe de pruebas y cobertura de cada regla |
| [`docs/RELEVAMIENTO.md`](docs/RELEVAMIENTO.md) | Relevamiento completo del proyecto |
| [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) | Manual de usuario por rol |
| [`docs/MANUAL_TECNICO.md`](docs/MANUAL_TECNICO.md) | Manual técnico: instalación, API, estructura y solución de problemas |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Guía paso a paso para publicar en Neon, Render y Netlify |
| [`AGENTS.md`](AGENTS.md) | Reglas para agentes de IA que trabajen en el repositorio |

## Estructura

```
backend/   API (src/), esquema SQL (db/), scripts y pruebas (test/)
frontend/  Aplicación web (index.html, css/, js/)
docs/      Documentación
```

## Seguridad

Los secretos (`DATABASE_URL`, `JWT_SECRET`, contraseñas iniciales) se configuran solo con variables de entorno. El archivo `.env` está en `.gitignore` y únicamente se versiona `.env.example` con valores vacíos. Un test (RN-28) verifica esto.

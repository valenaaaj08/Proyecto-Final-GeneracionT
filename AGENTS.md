# AGENTS.md — Reglas para agentes de IA que trabajen en este repositorio

Proyecto: **Futsal Club — Sistema de Gestión de Planteles**. Leé este archivo antes de tocar código.

## Fuente de verdad
1. `docs/SPEC.md` define las reglas de negocio, numeradas (RN-01 a RN-28). Si el código y la spec no coinciden, **la spec manda**.
2. `docs/PLAN.md` lista las tareas. Trabajá **una tarea por vez**, en orden.
3. No cambies la spec sin pedir confirmación a la persona responsable del proyecto.

## Arquitectura (no se negocia)
- Backend en capas: **Routes → Controller → Service → Repository**.
  - Controller: recibe HTTP y responde. Sin reglas de negocio.
  - Service: reglas de negocio y validaciones. No conoce Express ni SQL.
  - Repository: único lugar con SQL (PostgreSQL, consultas **siempre con parámetros** `$1, $2...`).
- Frontend: HTML + CSS + JavaScript sin framework, en `frontend/`. No contiene reglas de negocio: solo muestra y envía datos. El backend decide.

## Cómo trabajar
- Primero el test, después el código. Cada regla de la spec debe tener al menos un test que cite su código (`RN-xx`) en el nombre.
- Antes de dar una tarea por terminada: `cd backend && npm test` debe pasar completo.
- **Un commit por tarea**, con el formato `T<n>: descripción corta` (ejemplo: `T4: gestión de jugadores`). Marcá la tarea como hecha en `docs/PLAN.md` dentro del mismo commit.
- Código y mensajes de error en español. Nombres de funciones y variables en español salvo términos técnicos estándar.

## Prohibido
- Subir secretos: contraseñas, `JWT_SECRET`, `DATABASE_URL`, archivos `.env`. Solo se versiona `.env.example` con valores vacíos.
- Concatenar texto del usuario dentro de una consulta SQL.
- Devolver el `password_hash` en cualquier respuesta.
- Agregar dependencias nuevas sin justificarlo en el commit.
- Borrar datos de jugadores: la baja es lógica (RN-08).

## Comandos
- `cd backend && npm install && npm test` — instala y corre los tests (usan una base PostgreSQL en memoria, no necesitan internet).
- `npm run db:init` — crea las tablas en la base indicada por `DATABASE_URL`.
- `npm run db:seed` — crea los usuarios iniciales (y datos de ejemplo con `DEMO=true`).
- `npm start` — levanta el servidor.

# Manual técnico — Futsal Club

## 1. Requisitos

- Node.js 20 o superior y npm.
- Para producción: una base PostgreSQL (se usa Neon), un servicio para el backend (Render) y uno para el frontend (Netlify). Ver [`DESPLIEGUE.md`](DESPLIEGUE.md).

## 2. Estructura del repositorio

```
backend/
  db/schema.sql              esquema de la base de datos
  scripts/                   init-db.js, seed.js, dev-memoria.js, informe-pruebas.js
  src/
    app.js                   arma las capas y las rutas
    server.js                punto de entrada (lee las variables de entorno)
    db.js                    conexión a PostgreSQL
    errors.js                error con código HTTP
    config/divisiones.js     divisiones válidas y máximo de convocados
    utils/fechas.js          manejo de fechas en hora de Argentina
    middleware/auth.js       sesión obligatoria y permisos por rol
    routes/ controllers/ services/ repositories/
  test/                      pruebas (*.test.js) y utilidades (helpers.js)
frontend/                    index.html, css/styles.css, js/config.js, js/app.js
docs/                        documentación
```

## 3. Variables de entorno

Se definen en `backend/.env` (local) o en el panel del servicio (producción). Hay un modelo en `backend/.env.example`. **Nunca se suben al repositorio.**

| Variable | Obligatoria | Descripción |
|---|:-:|---|
| `DATABASE_URL` | sí | Cadena de conexión de PostgreSQL |
| `JWT_SECRET` | sí | Texto aleatorio de 32 caracteres o más para firmar las sesiones |
| `PORT` | no | Puerto (por defecto 3000; Render lo define solo) |
| `FRONTEND_URL` | en producción | URL del frontend, para permitir las llamadas desde el navegador (CORS). Se pueden poner varias separadas por coma |
| `SERVE_FRONTEND` | no | `true` para que el backend sirva también el frontend |
| `SEED_ADMIN_PASSWORD`, `SEED_TECNICO_PASSWORD`, `SEED_MEDICO_PASSWORD` | no | Contraseñas iniciales de `npm run db:seed`; si faltan, se generan y se muestran una vez |

Para generar un `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Comandos (dentro de `backend/`)

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm start` | Levanta el servidor |
| `npm run dev:memoria` | Demo local con base en memoria y frontend incluido |
| `npm run db:init` | Crea las tablas en la base de `DATABASE_URL` (se puede repetir sin problema) |
| `npm run db:seed` | Crea los tres usuarios. Con `DEMO=true` agrega jugadores y datos de ejemplo |
| `npm test` | Corre las 75 pruebas |
| `npm run informe` | Corre las pruebas y regenera `docs/INFORME_PRUEBAS.md` |

## 5. API

Todas las rutas empiezan con `/api` y usan JSON. Menos `login` y `health`, todas exigen la cabecera `Authorization: Bearer <token>`.

Los errores tienen siempre la forma `{ "error": "mensaje", "detalles": ["..."] }`, con estos códigos: 400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto con una regla.

| Método y ruta | Roles | Descripción |
|---|---|---|
| `GET /api/health` | público | Estado del servicio |
| `POST /api/auth/login` | público | Body `{ email, password }`. Devuelve `{ token, usuario }` |
| `GET /api/auth/me` | todos | Usuario de la sesión |
| `GET /api/divisiones` | todos | Las 7 divisiones |
| `GET /api/resumen` | todos | Resumen de cada división |
| `GET /api/jugadores` | todos | Filtros opcionales: `division`, `estadoApto` (`apto`, `vencido`, `no_apto`), `nombre` |
| `GET /api/jugadores/:id` | todos | Un jugador |
| `POST /api/jugadores` | admin, técnico | Alta. Body: `nombre, apellido, division, fechaNacimiento, altura, peso` |
| `PUT /api/jugadores/:id` | admin, técnico | Edición de esos mismos campos |
| `DELETE /api/jugadores/:id` | admin, técnico | Baja lógica (204) |
| `PUT /api/jugadores/:id/apto-fisico` | admin, médico | Body `{ aptoFisico, fechaApto }` |
| `PATCH /api/jugadores/:id/estadisticas` | admin, técnico | Body con uno o más de `goles, amarillas, rojas, asistencias` (enteros ≥ 1 a sumar) |
| `POST /api/jugadores/:id/rehabilitar` | admin, técnico | Quita la suspensión |
| `GET /api/partidos` | todos | Filtro opcional `division`. Incluye la cantidad de convocados |
| `POST /api/partidos` | admin, técnico | Body `{ division, rival, lugar, fecha }` |
| `GET /api/partidos/:id` | todos | Partido con sus convocados |
| `GET /api/partidos/:id/elegibles` | todos | Jugadores de la división, con `elegible` y `motivo` |
| `POST /api/partidos/:id/convocatoria` | admin, técnico | Body `{ jugadorIds: [1, 2] }`. Todo o nada |
| `DELETE /api/partidos/:id/convocatoria/:jugadorId` | admin, técnico | Quita a un convocado (204) |

**Ejemplo de jugador devuelto**

```json
{
  "id": 3, "nombre": "Mateo", "apellido": "Suárez", "division": "quinta",
  "fechaNacimiento": "2009-08-21", "edad": 17, "altura": 1.72, "peso": 64.5,
  "aptoFisico": true, "fechaApto": "2026-03-10", "estadoApto": "apto",
  "goles": 7, "amarillas": 3, "rojas": 0, "asistencias": 3,
  "suspendido": false, "activo": true
}
```

## 6. Cómo agregar una funcionalidad

1. Escribir la regla en `docs/SPEC.md` con un código `RN-xx` nuevo.
2. Agregar la tarea en `docs/PLAN.md`.
3. Escribir primero el test (el nombre del test debe incluir el código `RN-xx`).
4. Implementar en el orden Repository → Service → Controller → Routes.
5. Correr `npm run informe`: falla si alguna regla queda sin prueba.
6. Hacer un commit por tarea.

## 7. Solución de problemas

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El servidor no arranca: «Falta DATABASE_URL» | No hay archivo `.env` o está incompleto | Copiar `.env.example` a `.env` y completarlo |
| «JWT_SECRET debe tener al menos 32 caracteres» | Falta el secreto o es corto | Generar uno con el comando de la sección 3 |
| El frontend dice «No se pudo conectar con el servidor» | `API_URL` mal puesta en `frontend/js/config.js`, o el backend está dormido | Revisar la URL; abrir `/api/health` y esperar |
| El navegador bloquea las llamadas (error de CORS) | `FRONTEND_URL` no coincide con la URL del frontend | Poner la URL exacta, sin barra final, y redeplegar |
| Error de SSL al conectar con Neon | Falta `?sslmode=require` | Usar la cadena de conexión completa que da Neon |
| `relation "usuarios" does not exist` | No se crearon las tablas | Correr `npm run db:init` |
| No puedo ingresar después del despliegue | No se cargaron los usuarios | Correr `npm run db:seed` con `DATABASE_URL` apuntando a Neon |
| El primer pedido tarda mucho en Render | El plan gratuito duerme el servicio | Esperar hasta un minuto |

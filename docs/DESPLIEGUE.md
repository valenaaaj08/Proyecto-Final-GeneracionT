# Guía de despliegue — paso a paso

Se publican tres cosas: la **base de datos** en Neon, el **backend** en Render y el **frontend** en Netlify. El orden importa. Hace falta una cuenta gratuita en GitHub, Neon, Render y Netlify.

## Paso 1. Subir el proyecto a GitHub

1. Creá un repositorio **público** nuevo en GitHub (sin README ni .gitignore, porque ya los tiene el proyecto).
2. Desde la carpeta del proyecto:

```bash
git remote add origin https://github.com/TU-USUARIO/futsal-club.git
git push -u origin main
```

3. Revisá en GitHub que **no** aparezca ningún archivo `.env`.

## Paso 2. Base de datos en Neon

1. En https://neon.tech creá un proyecto (por ejemplo `futsal-club`).
2. Copiá la **cadena de conexión** (empieza con `postgresql://` y termina con `?sslmode=require`).
3. En tu computadora, creá `backend/.env` con esa cadena y con un `JWT_SECRET` (ver el manual técnico), y corré:

```bash
cd backend
npm install
npm run db:init
DEMO=true SEED_ADMIN_PASSWORD='elegí-una' SEED_TECNICO_PASSWORD='elegí-otra' SEED_MEDICO_PASSWORD='elegí-otra-más' npm run db:seed
```

Eso crea las tablas, los tres usuarios con las contraseñas que elegiste y datos de ejemplo para que quien pruebe la aplicación encuentre jugadores. **Anotá las contraseñas fuera del repositorio** (por ejemplo, para pasarlas en la entrega del campus). Si dejás vacías las variables `SEED_*`, se generan al azar y se muestran una sola vez en pantalla.

## Paso 3. Backend en Render

1. En https://render.com elegí **New → Web Service** y conectá tu repositorio de GitHub. (También sirve **New → Blueprint**, que lee `render.yaml`.)
2. Configuración, si no usás el Blueprint:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

3. En **Environment** agregá:

| Variable | Valor |
|---|---|
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | la cadena de Neon |
| `JWT_SECRET` | un texto aleatorio de 32 o más caracteres |
| `FRONTEND_URL` | por ahora vacío; se completa en el paso 5 |

4. Cuando termine, abrí `https://TU-SERVICIO.onrender.com/api/health`: tiene que responder `{"estado":"ok"}`.

## Paso 4. Frontend en Netlify

1. Editá `frontend/js/config.js` y poné la URL de Render:

```js
window.API_URL = 'https://TU-SERVICIO.onrender.com';
```

2. Hacé commit y push (`git commit -am "Configura la URL del backend" && git push`).
3. En https://netlify.com elegí **Add new site → Import an existing project**, conectá el repositorio y confirmá: **Base directory** vacío, **Publish directory** `frontend`, sin comando de build (el archivo `netlify.toml` ya lo indica).
4. Copiá la URL que te da Netlify (por ejemplo `https://futsal-club.netlify.app`).

## Paso 5. Permitir que el frontend hable con el backend (CORS)

1. En Render, en las variables del servicio, poné `FRONTEND_URL` con la URL de Netlify, **sin barra al final**.
2. Guardá. Render vuelve a desplegar solo.

## Paso 6. Verificar

Abrí la URL de Netlify, ingresá con cada usuario y recorré la lista de verificación del final de [`INFORME_PRUEBAS.md`](INFORME_PRUEBAS.md). Después completá en el `README.md` los links y mové el estado de cada punto de esa lista.

## Alternativa más simple: un solo servicio

Si Netlify o CORS dan problemas, el backend puede servir también el frontend. En Render agregá `SERVE_FRONTEND=true`, dejá `window.API_URL = ''` en `frontend/js/config.js` y usá solo la URL de Render. Es menos prolijo, pero evita CORS y un servicio.

## Antes de la presentación

- El plan gratuito de Render se duerme tras unos minutos sin uso. **Abrí `/api/health` un par de minutos antes** para que esté despierto.
- Probá el ingreso con los tres usuarios desde otro dispositivo o una ventana privada.

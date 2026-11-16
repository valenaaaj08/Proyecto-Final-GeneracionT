// Punto de entrada. Toda la configuración sale de variables de entorno (RN-28).
try { process.loadEnvFile(); } catch { /* sin archivo .env: se usan las variables del sistema */ }
const crearApp = require('./app');
const { crearPool } = require('./db');

const puerto = process.env.PORT || 3000;
const app = crearApp({
  pool: crearPool(process.env.DATABASE_URL),
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  servirFrontend: process.env.SERVE_FRONTEND === 'true',
});
app.listen(puerto, () => console.log(`Futsal Club escuchando en el puerto ${puerto}`));

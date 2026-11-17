// Crea las tablas en la base indicada por DATABASE_URL.  Uso: npm run db:init
try { process.loadEnvFile(); } catch { /* sin archivo .env: se usan las variables del sistema */ }
const { crearPool, leerEsquema } = require('../src/db');

(async () => {
  const pool = crearPool(process.env.DATABASE_URL);
  try {
    await pool.query(leerEsquema());
    console.log('Tablas creadas (o ya existían).');
  } finally {
    await pool.end();
  }
})().catch((e) => { console.error('No se pudo crear el esquema:', e.message); process.exit(1); });

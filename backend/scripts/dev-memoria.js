// Modo demo local: levanta la API y el frontend con una base en memoria (sin instalar PostgreSQL ni usar internet).
// Los datos se pierden al cerrar. Uso: npm run dev:memoria  →  http://localhost:3000
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { newDb } = require('pg-mem');
const { leerEsquema } = require('../src/db');
const crearApp = require('../src/app');

(async () => {
  const db = newDb();
  db.public.none(leerEsquema());
  const pool = new (db.adapters.createPg().Pool)();
  const clave = crypto.randomBytes(6).toString('base64url');
  const hash = bcrypt.hashSync(clave, 10);
  for (const [nombre, rol] of [['Administrador', 'admin'], ['Director Técnico', 'tecnico'], ['Cuerpo Médico', 'medico']]) {
    await pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)', [nombre, `${rol}@futsalclub.com`, hash, rol]);
  }
  const app = crearApp({ pool, jwtSecret: crypto.randomBytes(32).toString('hex'), servirFrontend: true });
  const puerto = process.env.PORT || 3000;
  app.listen(puerto, () => {
    console.log(`Futsal Club (demo en memoria) en http://localhost:${puerto}`);
    console.log(`Usuarios: admin@futsalclub.com, tecnico@futsalclub.com, medico@futsalclub.com  —  contraseña de esta sesión: ${clave}`);
  });
})();

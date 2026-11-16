// Utilidades de test: una base PostgreSQL en memoria (pg-mem) con el mismo esquema que producción.
const { newDb } = require('pg-mem');
const { leerEsquema } = require('../src/db');

function crearPoolDePrueba() {
  const db = newDb();
  db.public.none(leerEsquema());
  const { Pool } = db.adapters.createPg();
  return new Pool();
}

module.exports = { crearPoolDePrueba };

// ---- Utilidades para tests de la API completa ----
const bcrypt = require('bcryptjs');
const crearApp = require('../src/app');

const CLAVE_DE_PRUEBA = 'clave-de-prueba-123';
const SECRETO_DE_PRUEBA = 'secreto-solo-para-tests-0123456789abcdef';
const HOY = new Date('2026-11-16T12:00:00Z');

// Levanta la API con base en memoria y un usuario por rol. Devuelve utilidades para llamar a la API.
async function levantarApp({ ahora = () => HOY } = {}) {
  const pool = crearPoolDePrueba();
  const hash = bcrypt.hashSync(CLAVE_DE_PRUEBA, 4);
  for (const rol of ['admin', 'tecnico', 'medico']) {
    await pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)', [`Usuario ${rol}`, `${rol}@test.com`, hash, rol]);
  }
  const app = crearApp({ pool, jwtSecret: SECRETO_DE_PRUEBA, ahora });
  const servidor = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://localhost:${servidor.address().port}`;

  const tokens = {};
  async function llamar(metodo, ruta, { rol, cuerpo, token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const t = token ?? (rol ? await tokenDe(rol) : null);
    if (t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(base + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    const texto = await res.text();
    return { status: res.status, cuerpo: texto ? JSON.parse(texto) : null };
  }
  async function tokenDe(rol) {
    if (!tokens[rol]) {
      const r = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: `${rol}@test.com`, password: CLAVE_DE_PRUEBA }) });
      tokens[rol] = (await r.json()).token;
    }
    return tokens[rol];
  }
  return { pool, base, llamar, tokenDe, cerrar: () => servidor.close(), HOY };
}

module.exports.levantarApp = levantarApp;
module.exports.CLAVE_DE_PRUEBA = CLAVE_DE_PRUEBA;
module.exports.SECRETO_DE_PRUEBA = SECRETO_DE_PRUEBA;

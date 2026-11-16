const test = require('node:test');
const assert = require('node:assert/strict');
const { crearPoolDePrueba } = require('./helpers');

test('T2: el esquema crea las cuatro tablas', async () => {
  const pool = crearPoolDePrueba();
  for (const tabla of ['usuarios', 'jugadores', 'partidos', 'convocatorias']) {
    const r = await pool.query(`SELECT COUNT(*) AS n FROM ${tabla}`);
    assert.equal(Number(r.rows[0].n), 0);
  }
});

test('T2: la base rechaza jugadores duplicados (respaldo de RN-08)', async () => {
  const pool = crearPoolDePrueba();
  const sql = `INSERT INTO jugadores (nombre, apellido, division, fecha_nacimiento, altura, peso) VALUES ($1,$2,$3,$4,$5,$6)`;
  await pool.query(sql, ['Ana', 'Lopez', 'primera', '2000-01-01', 1.7, 60]);
  await assert.rejects(pool.query(sql, ['Ana', 'Lopez', 'primera', '2000-01-01', 1.7, 60]));
});

test('T2: la base rechaza roles inexistentes', async () => {
  const pool = crearPoolDePrueba();
  await assert.rejects(pool.query(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('x','x@x.com','h','superman')`));
});

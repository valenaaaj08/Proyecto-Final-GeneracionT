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

// Conexión a PostgreSQL. Los tests usan otra conexión (en memoria), ver test/helpers.js.
const fs = require('node:fs');
const path = require('node:path');
const { Pool, types } = require('pg');

// Fechas (DATE) como texto AAAA-MM-DD y NUMERIC como número, para no depender de la zona horaria del servidor.
types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1700, (valor) => parseFloat(valor));

const RUTA_ESQUEMA = path.join(__dirname, '../db/schema.sql');

function leerEsquema() {
  return fs.readFileSync(RUTA_ESQUEMA, 'utf-8');
}

function crearPool(databaseUrl) {
  if (!databaseUrl) throw new Error('Falta DATABASE_URL. Copiá backend/.env.example a backend/.env y completalo.');
  return new Pool({ connectionString: databaseUrl, max: 5 });
}

module.exports = { crearPool, leerEsquema };

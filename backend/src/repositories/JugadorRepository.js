// REPOSITORY de jugadores: único lugar con SQL de la tabla jugadores. Todas las consultas llevan parámetros.
const AppError = require('../errors');

const COLUMNAS = `id, nombre, apellido, division, fecha_nacimiento, altura, peso, apto_fisico, fecha_apto,
  goles, amarillas, rojas, asistencias, suspendido, activo`;

const aFecha = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);

function aJugador(f) {
  return {
    id: f.id, nombre: f.nombre, apellido: f.apellido, division: f.division,
    fechaNacimiento: aFecha(f.fecha_nacimiento), altura: Number(f.altura), peso: Number(f.peso),
    aptoFisico: f.apto_fisico, fechaApto: f.fecha_apto ? aFecha(f.fecha_apto) : null,
    goles: f.goles, amarillas: f.amarillas, rojas: f.rojas, asistencias: f.asistencias,
    suspendido: f.suspendido, activo: f.activo,
  };
}

// Una violación de la restricción UNIQUE de la base equivale a un jugador duplicado (RN-08)
function traducirError(e) {
  if (e && e.code === '23505') throw new AppError(409, 'Ya existe un jugador con ese nombre, apellido y fecha de nacimiento (puede estar dado de baja)');
  throw e;
}

class JugadorRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async activos() {
    const r = await this.pool.query(`SELECT ${COLUMNAS} FROM jugadores WHERE activo = TRUE ORDER BY apellido, nombre`);
    return r.rows.map(aJugador);
  }

  // Incluye a los dados de baja: sirve para detectar duplicados (RN-08)
  async todos() {
    const r = await this.pool.query(`SELECT ${COLUMNAS} FROM jugadores`);
    return r.rows.map(aJugador);
  }

  async porId(id) {
    const r = await this.pool.query(`SELECT ${COLUMNAS} FROM jugadores WHERE id = $1`, [id]);
    return r.rows[0] ? aJugador(r.rows[0]) : null;
  }

  async porIds(ids) {
    if (!ids.length) return [];
    const marcas = ids.map((_, i) => `$${i + 1}`).join(', ');
    const r = await this.pool.query(`SELECT ${COLUMNAS} FROM jugadores WHERE id IN (${marcas})`, ids);
    return r.rows.map(aJugador);
  }

  async crear(j) {
    try {
      const r = await this.pool.query(
        `INSERT INTO jugadores (nombre, apellido, division, fecha_nacimiento, altura, peso)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNAS}`,
        [j.nombre, j.apellido, j.division, j.fechaNacimiento, j.altura, j.peso]
      );
      return aJugador(r.rows[0]);
    } catch (e) { return traducirError(e); }
  }

  // Guarda todos los campos modificables de un jugador ya existente
  async guardar(j) {
    try {
      const r = await this.pool.query(
        `UPDATE jugadores SET nombre = $2, apellido = $3, division = $4, fecha_nacimiento = $5, altura = $6, peso = $7,
           apto_fisico = $8, fecha_apto = $9, goles = $10, amarillas = $11, rojas = $12, asistencias = $13,
           suspendido = $14, activo = $15
         WHERE id = $1 RETURNING ${COLUMNAS}`,
        [j.id, j.nombre, j.apellido, j.division, j.fechaNacimiento, j.altura, j.peso, j.aptoFisico, j.fechaApto,
          j.goles, j.amarillas, j.rojas, j.asistencias, j.suspendido, j.activo]
      );
      return aJugador(r.rows[0]);
    } catch (e) { return traducirError(e); }
  }
}
module.exports = JugadorRepository;

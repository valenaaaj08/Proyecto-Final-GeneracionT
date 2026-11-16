// REPOSITORY de partidos y convocatorias: único lugar con SQL de estas tablas.
const aFecha = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);
const aPartido = (f) => ({ id: f.id, division: f.division, rival: f.rival, lugar: f.lugar, fecha: aFecha(f.fecha) });

class PartidoRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async crear(p) {
    const r = await this.pool.query(
      'INSERT INTO partidos (division, rival, lugar, fecha) VALUES ($1, $2, $3, $4) RETURNING id, division, rival, lugar, fecha',
      [p.division, p.rival, p.lugar, p.fecha]
    );
    return aPartido(r.rows[0]);
  }

  async porId(id) {
    const r = await this.pool.query('SELECT id, division, rival, lugar, fecha FROM partidos WHERE id = $1', [id]);
    return r.rows[0] ? aPartido(r.rows[0]) : null;
  }

  async listar() {
    const r = await this.pool.query('SELECT id, division, rival, lugar, fecha FROM partidos ORDER BY fecha, id');
    return r.rows.map(aPartido);
  }

  async contarConvocados() {
    const r = await this.pool.query('SELECT partido_id, COUNT(*) AS n FROM convocatorias GROUP BY partido_id');
    return new Map(r.rows.map((f) => [f.partido_id, Number(f.n)]));
  }

  async idsConvocados(partidoId) {
    const r = await this.pool.query('SELECT jugador_id FROM convocatorias WHERE partido_id = $1 ORDER BY jugador_id', [partidoId]);
    return r.rows.map((f) => f.jugador_id);
  }

  // Convocatorias de esos jugadores en otros partidos de la misma fecha (RN-23)
  async conflictosEnFecha(jugadorIds, fecha, partidoId) {
    if (!jugadorIds.length) return [];
    const marcas = jugadorIds.map((_, i) => `$${i + 3}`).join(', ');
    const r = await this.pool.query(
      `SELECT c.jugador_id, c.partido_id FROM convocatorias c JOIN partidos p ON p.id = c.partido_id
       WHERE p.fecha = $1 AND p.id <> $2 AND c.jugador_id IN (${marcas})`,
      [fecha, partidoId, ...jugadorIds]
    );
    return r.rows;
  }

  // Una sola sentencia INSERT: se guardan todos o ninguno (RN-25)
  async agregarConvocados(partidoId, jugadorIds) {
    if (!jugadorIds.length) return;
    const valores = jugadorIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    await this.pool.query(`INSERT INTO convocatorias (partido_id, jugador_id) VALUES ${valores}`, [partidoId, ...jugadorIds]);
  }

  async quitarConvocado(partidoId, jugadorId) {
    const r = await this.pool.query('DELETE FROM convocatorias WHERE partido_id = $1 AND jugador_id = $2', [partidoId, jugadorId]);
    return r.rowCount > 0;
  }
}
module.exports = PartidoRepository;

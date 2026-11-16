// CONTROLLER de jugadores: traduce HTTP <-> Service. Sin reglas de negocio.
const { DIVISIONES } = require('../config/divisiones');

const idDe = (req) => Number(req.params.id);

class JugadorController {
  constructor(servicio) {
    this.servicio = servicio;
  }

  divisiones = (req, res) => res.json(DIVISIONES);

  listar = async (req, res, next) => {
    try { res.json(await this.servicio.listar(req.query)); } catch (e) { next(e); }
  };

  obtener = async (req, res, next) => {
    try { res.json(await this.servicio.obtener(idDe(req))); } catch (e) { next(e); }
  };

  crear = async (req, res, next) => {
    try {
      const jugador = await this.servicio.crear(req.body);
      res.status(201).location(`/api/jugadores/${jugador.id}`).json(jugador);
    } catch (e) { next(e); }
  };

  actualizar = async (req, res, next) => {
    try { res.json(await this.servicio.actualizar(idDe(req), req.body)); } catch (e) { next(e); }
  };

  baja = async (req, res, next) => {
    try { await this.servicio.darDeBaja(idDe(req)); res.status(204).end(); } catch (e) { next(e); }
  };
  cargarApto = async (req, res, next) => {
    try { res.json(await this.servicio.cargarApto(idDe(req), req.body)); } catch (e) { next(e); }
  };

  estadisticas = async (req, res, next) => {
    try { res.json(await this.servicio.registrarEstadisticas(idDe(req), req.body)); } catch (e) { next(e); }
  };

  rehabilitar = async (req, res, next) => {
    try { res.json(await this.servicio.rehabilitar(idDe(req))); } catch (e) { next(e); }
  };
}
module.exports = JugadorController;

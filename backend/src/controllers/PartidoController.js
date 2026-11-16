const idDe = (valor) => Number(valor);

class PartidoController {
  constructor(servicio) {
    this.servicio = servicio;
  }

  listar = async (req, res, next) => { try { res.json(await this.servicio.listar(req.query)); } catch (e) { next(e); } };
  obtener = async (req, res, next) => { try { res.json(await this.servicio.obtener(idDe(req.params.id))); } catch (e) { next(e); } };
  elegibles = async (req, res, next) => { try { res.json(await this.servicio.elegibles(idDe(req.params.id))); } catch (e) { next(e); } };

  crear = async (req, res, next) => {
    try {
      const partido = await this.servicio.crear(req.body);
      res.status(201).location(`/api/partidos/${partido.id}`).json(partido);
    } catch (e) { next(e); }
  };

  convocar = async (req, res, next) => {
    try { res.json(await this.servicio.convocar(idDe(req.params.id), (req.body ?? {}).jugadorIds)); } catch (e) { next(e); }
  };

  quitar = async (req, res, next) => {
    try { await this.servicio.quitar(idDe(req.params.id), idDe(req.params.jugadorId)); res.status(204).end(); } catch (e) { next(e); }
  };
}
module.exports = PartidoController;

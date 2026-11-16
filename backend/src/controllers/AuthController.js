class AuthController {
  constructor(servicio) {
    this.servicio = servicio;
  }

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body ?? {};
      res.json(await this.servicio.iniciarSesion(email, password));
    } catch (e) { next(e); }
  };

  yo = (req, res) => res.json({ usuario: req.usuario });
}
module.exports = AuthController;

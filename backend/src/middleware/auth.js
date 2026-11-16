// Middlewares de acceso: RN-01 (sesión obligatoria) y RN-02 (permisos por rol).
const AppError = require('../errors');

function autenticar(authService) {
  return (req, res, next) => {
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');
    if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Hay que iniciar sesión'));
    try {
      req.usuario = authService.verificarToken(token);
      next();
    } catch (e) {
      next(e);
    }
  };
}

function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError(403, 'No tenés permiso para esta acción'));
    }
    next();
  };
}

module.exports = { autenticar, requiereRol };

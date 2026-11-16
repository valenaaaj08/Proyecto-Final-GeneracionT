// SERVICE de autenticación: RN-03 (hash y mensaje único), RN-04 (8 horas), RN-05 (sin hash en respuestas).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../errors');

const DURACION_SESION = '8h';

class AuthService {
  constructor(usuarios, jwtSecret) {
    if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
    this.usuarios = usuarios;
    this.secret = jwtSecret;
  }

  async iniciarSesion(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw new AppError(400, 'Datos inválidos', ['email y password son obligatorios']);
    }
    const usuario = await this.usuarios.buscarPorEmail(email.trim());
    const ok = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;
    if (!ok) throw new AppError(401, 'Credenciales inválidas');

    const token = jwt.sign({ sub: usuario.id, nombre: usuario.nombre, rol: usuario.rol }, this.secret, {
      expiresIn: DURACION_SESION,
    });
    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
  }

  verificarToken(token) {
    try {
      const datos = jwt.verify(token, this.secret);
      return { id: datos.sub, nombre: datos.nombre, rol: datos.rol };
    } catch {
      throw new AppError(401, 'Sesión inválida o vencida');
    }
  }
}
module.exports = AuthService;

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const UsuarioRepository = require('./repositories/UsuarioRepository');
const AuthService = require('./services/AuthService');
const AuthController = require('./controllers/AuthController');
const authRoutes = require('./routes/authRoutes');
const { autenticar } = require('./middleware/auth');
const AppError = require('./errors');
// [imports]

// Arma la cadena Repository -> Service -> Controller -> Routes (inyección de dependencias).
function crearApp({ pool, jwtSecret, ahora = () => new Date(), frontendUrl = '', servirFrontend = false }) {
  const app = express();
  app.use(cors({ origin: frontendUrl ? frontendUrl.split(',').map((u) => u.trim()) : false }));
  app.use(express.json());

  const usuarios = new UsuarioRepository(pool);
  const authService = new AuthService(usuarios, jwtSecret);
  const protegido = autenticar(authService);

  app.get('/api/health', (req, res) => res.json({ estado: 'ok' }));
  app.use('/api/auth', authRoutes(new AuthController(authService), protegido));
  // [rutas]

  if (servirFrontend) app.use(express.static(path.join(__dirname, '../../frontend')));
  app.use('/api', (req, res, next) => next(new AppError(404, 'Ruta inexistente')));

  // RN-27: formato único de errores
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido', detalles: [] });
    if (err.status) return res.status(err.status).json({ error: err.message, detalles: err.detalles ?? [] });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor', detalles: [] });
  });
  return app;
}
module.exports = crearApp;

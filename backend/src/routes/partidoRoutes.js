const { Router } = require('express');
const { requiereRol } = require('../middleware/auth');

module.exports = (c) => {
  const router = Router();
  const gestion = requiereRol('admin', 'tecnico');
  router.get('/', c.listar);
  router.post('/', gestion, c.crear);
  router.get('/:id', c.obtener);
  router.get('/:id/elegibles', c.elegibles);
  router.post('/:id/convocatoria', gestion, c.convocar);
  router.delete('/:id/convocatoria/:jugadorId', gestion, c.quitar);
  return router;
};

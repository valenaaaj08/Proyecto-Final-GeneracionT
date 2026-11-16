const { Router } = require('express');
const { requiereRol } = require('../middleware/auth');

// Permisos según la tabla de docs/SPEC.md (RN-02)
module.exports = (c) => {
  const router = Router();
  const gestion = requiereRol('admin', 'tecnico');
  router.get('/', c.listar);
  router.get('/:id', c.obtener);
  router.post('/', gestion, c.crear);
  router.put('/:id', gestion, c.actualizar);
  router.delete('/:id', gestion, c.baja);
  router.put('/:id/apto-fisico', requiereRol('admin', 'medico'), c.cargarApto);
  return router;
};

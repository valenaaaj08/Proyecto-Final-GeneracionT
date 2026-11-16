const test = require('node:test');
const assert = require('node:assert/strict');
const { levantarApp } = require('./helpers');

let t, id;
test.before(async () => {
  t = await levantarApp(); // "hoy" es 2026-11-16
  const r = await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: { nombre: 'Apto', apellido: 'Prueba', division: 'quinta', fechaNacimiento: '2009-01-01', altura: 1.7, peso: 60 } });
  id = r.cuerpo.id;
});
test.after(() => t.cerrar());

const cargar = (rol, cuerpo) => t.llamar('PUT', `/api/jugadores/${id}/apto-fisico`, { rol, cuerpo });

test('RN-13: solo admin y médico cargan el apto físico; el técnico recibe 403', async () => {
  assert.equal((await cargar('tecnico', { aptoFisico: true, fechaApto: '2026-03-10' })).status, 403);
  assert.equal((await cargar('medico', { aptoFisico: true, fechaApto: '2026-03-10' })).status, 200);
  assert.equal((await cargar('admin', { aptoFisico: true, fechaApto: '2026-03-10' })).status, 200);
});

test('RN-11: un apto cargado este año figura como "apto"', async () => {
  const r = await cargar('medico', { aptoFisico: true, fechaApto: '2026-03-10' });
  assert.equal(r.cuerpo.estadoApto, 'apto');
  assert.equal(r.cuerpo.fechaApto, '2026-03-10');
});

test('RN-11: un apto de un año anterior figura como "vencido"', async () => {
  const r = await cargar('medico', { aptoFisico: true, fechaApto: '2025-03-10' });
  assert.equal(r.cuerpo.estadoApto, 'vencido');
});

test('RN-11: sin apto figura como "no_apto" y se borra la fecha', async () => {
  const r = await cargar('medico', { aptoFisico: false, fechaApto: '2026-03-10' });
  assert.equal(r.cuerpo.estadoApto, 'no_apto');
  assert.equal(r.cuerpo.fechaApto, null);
});

test('RN-12: marcar apto exige una fecha real y no futura', async () => {
  assert.equal((await cargar('medico', { aptoFisico: true })).status, 400);
  assert.equal((await cargar('medico', { aptoFisico: true, fechaApto: '2026-02-31' })).status, 400);
  assert.equal((await cargar('medico', { aptoFisico: true, fechaApto: '2026-12-01' })).status, 400);
  assert.equal((await cargar('medico', { aptoFisico: 'si', fechaApto: '2026-03-10' })).status, 400);
});

test('RN-11: el listado filtra por estado del apto', async () => {
  await cargar('medico', { aptoFisico: true, fechaApto: '2025-03-10' });
  const vencidos = await t.llamar('GET', '/api/jugadores?estadoApto=vencido', { rol: 'medico' });
  assert.ok(vencidos.cuerpo.some((j) => j.id === id));
  const aptos = await t.llamar('GET', '/api/jugadores?estadoApto=apto', { rol: 'medico' });
  assert.ok(!aptos.cuerpo.some((j) => j.id === id));
});

test('cargar el apto de un jugador inexistente devuelve 404', async () => {
  assert.equal((await t.llamar('PUT', '/api/jugadores/9999/apto-fisico', { rol: 'medico', cuerpo: { aptoFisico: false } })).status, 404);
});

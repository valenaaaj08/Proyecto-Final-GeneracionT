const test = require('node:test');
const assert = require('node:assert/strict');
const { levantarApp } = require('./helpers');

let t, n = 0;
test.before(async () => { t = await levantarApp(); });
test.after(() => t.cerrar());

async function nuevoJugador() {
  n += 1;
  const r = await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: { nombre: `Jugador${n}`, apellido: 'Estadistica', division: 'primera', fechaNacimiento: '2000-01-01', altura: 1.8, peso: 75 } });
  return r.cuerpo.id;
}
const sumar = (id, cuerpo, rol = 'tecnico') => t.llamar('PATCH', `/api/jugadores/${id}/estadisticas`, { rol, cuerpo });

test('RN-14: las estadísticas se suman a lo que ya había', async () => {
  const id = await nuevoJugador();
  await sumar(id, { goles: 2, asistencias: 1 });
  const r = await sumar(id, { goles: 3 });
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.goles, 5);
  assert.equal(r.cuerpo.asistencias, 1);
});

test('RN-14: no se aceptan ceros, negativos, decimales ni textos, ni un pedido vacío', async () => {
  const id = await nuevoJugador();
  for (const malo of [{ goles: 0 }, { goles: -1 }, { goles: 1.5 }, { goles: '3' }, {}, { otro: 4 }]) {
    assert.equal((await sumar(id, malo)).status, 400, JSON.stringify(malo));
  }
  const j = (await t.llamar('GET', `/api/jugadores/${id}`, { rol: 'tecnico' })).cuerpo;
  assert.equal(j.goles, 0);
});

test('RN-02: el médico no puede registrar estadísticas (403)', async () => {
  const id = await nuevoJugador();
  assert.equal((await sumar(id, { goles: 1 }, 'medico')).status, 403);
});

test('RN-15: no se registran estadísticas a un jugador dado de baja', async () => {
  const id = await nuevoJugador();
  await t.llamar('DELETE', `/api/jugadores/${id}`, { rol: 'tecnico' });
  assert.equal((await sumar(id, { goles: 1 })).status, 404);
});

test('RN-16: una tarjeta roja suspende al jugador', async () => {
  const id = await nuevoJugador();
  const r = await sumar(id, { rojas: 1 });
  assert.equal(r.cuerpo.suspendido, true);
});

test('RN-16: 4 amarillas no suspenden, la quinta sí', async () => {
  const id = await nuevoJugador();
  assert.equal((await sumar(id, { amarillas: 4 })).cuerpo.suspendido, false);
  const r = await sumar(id, { amarillas: 1 });
  assert.equal(r.cuerpo.amarillas, 5);
  assert.equal(r.cuerpo.suspendido, true);
});

test('RN-17: rehabilitar quita la suspensión, pone las amarillas en 0 y conserva las rojas', async () => {
  const id = await nuevoJugador();
  await sumar(id, { rojas: 1, amarillas: 5 });
  const r = await t.llamar('POST', `/api/jugadores/${id}/rehabilitar`, { rol: 'tecnico' });
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.suspendido, false);
  assert.equal(r.cuerpo.amarillas, 0);
  assert.equal(r.cuerpo.rojas, 1);
});

test('RN-17: rehabilitar a un jugador que no está suspendido devuelve 409', async () => {
  const id = await nuevoJugador();
  assert.equal((await t.llamar('POST', `/api/jugadores/${id}/rehabilitar`, { rol: 'tecnico' })).status, 409);
});

test('RN-17: el médico no puede rehabilitar (403)', async () => {
  const id = await nuevoJugador();
  await sumar(id, { rojas: 1 });
  assert.equal((await t.llamar('POST', `/api/jugadores/${id}/rehabilitar`, { rol: 'medico' })).status, 403);
});

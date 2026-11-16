const test = require('node:test');
const assert = require('node:assert/strict');
const { levantarApp } = require('./helpers');

let t, n = 0;
test.before(async () => { t = await levantarApp(); }); // hoy = 2026-11-16
test.after(() => t.cerrar());

const FUTURO = '2026-12-05';

async function jugador(division = 'primera', { apto = true } = {}) {
  n += 1;
  const r = await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: { nombre: `Nombre${n}`, apellido: `Apellido${n}`, division, fechaNacimiento: '2000-01-01', altura: 1.8, peso: 75 } });
  if (apto) await t.llamar('PUT', `/api/jugadores/${r.cuerpo.id}/apto-fisico`, { rol: 'medico', cuerpo: { aptoFisico: true, fechaApto: '2026-03-01' } });
  return r.cuerpo.id;
}
async function partido(fecha = FUTURO, division = 'primera') {
  const r = await t.llamar('POST', '/api/partidos', { rol: 'tecnico', cuerpo: { division, rival: 'Club Rival', lugar: 'Estadio Cubierto', fecha } });
  return r.cuerpo.id;
}
const convocar = (id, jugadorIds, rol = 'tecnico') => t.llamar('POST', `/api/partidos/${id}/convocatoria`, { rol, cuerpo: { jugadorIds } });

test('RN-18: se crea un partido con división, rival, lugar y fecha futura (o de hoy)', async () => {
  const r = await t.llamar('POST', '/api/partidos', { rol: 'tecnico', cuerpo: { division: 'Primera', rival: 'Atlético', lugar: 'Polideportivo', fecha: '2026-11-16' } });
  assert.equal(r.status, 201);
  assert.equal(r.cuerpo.division, 'primera');
});

test('RN-18: una fecha pasada, una división inválida o datos faltantes devuelven 400', async () => {
  const base = { division: 'primera', rival: 'Atlético', lugar: 'Polideportivo', fecha: FUTURO };
  for (const malo of [{ fecha: '2026-11-15' }, { division: 'novena' }, { rival: '' }, { lugar: 'x' }, { fecha: '2026-02-30' }]) {
    assert.equal((await t.llamar('POST', '/api/partidos', { rol: 'tecnico', cuerpo: { ...base, ...malo } })).status, 400, JSON.stringify(malo));
  }
});

test('RN-02: el médico no puede crear partidos ni convocar (403)', async () => {
  assert.equal((await t.llamar('POST', '/api/partidos', { rol: 'medico', cuerpo: { division: 'primera', rival: 'Atlético', lugar: 'Polideportivo', fecha: FUTURO } })).status, 403);
  const p = await partido(); const j = await jugador();
  assert.equal((await convocar(p, [j], 'medico')).status, 403);
});

test('se convoca a jugadores elegibles y el partido los lista', async () => {
  const p = await partido(); const a = await jugador(); const b = await jugador();
  const r = await convocar(p, [a, b]);
  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.convocados.map((j) => j.id).sort(), [a, b].sort());
  const lista = (await t.llamar('GET', '/api/partidos?division=primera', { rol: 'medico' })).cuerpo;
  assert.equal(lista.find((x) => x.id === p).convocados, 2);
});

test('RN-19: no se convoca a jugadores de otra división ni dados de baja', async () => {
  const p = await partido(FUTURO, 'primera');
  const otra = await jugador('sexta');
  const baja = await jugador('primera');
  await t.llamar('DELETE', `/api/jugadores/${baja}`, { rol: 'tecnico' });
  const r1 = await convocar(p, [otra]);
  assert.equal(r1.status, 409);
  assert.match(r1.cuerpo.detalles[0], /otra división/);
  const r2 = await convocar(p, [baja]);
  assert.equal(r2.status, 409);
  assert.match(r2.cuerpo.detalles[0], /dado de baja/);
});

test('RN-20: no se convoca a un jugador suspendido', async () => {
  const p = await partido(); const j = await jugador();
  await t.llamar('PATCH', `/api/jugadores/${j}/estadisticas`, { rol: 'tecnico', cuerpo: { rojas: 1 } });
  const r = await convocar(p, [j]);
  assert.equal(r.status, 409);
  assert.match(r.cuerpo.detalles[0], /suspendido/);
});

test('RN-21: no se convoca a jugadores sin apto vigente (no apto o vencido)', async () => {
  const p = await partido();
  const sin = await jugador('primera', { apto: false });
  const vencido = await jugador('primera', { apto: false });
  await t.llamar('PUT', `/api/jugadores/${vencido}/apto-fisico`, { rol: 'medico', cuerpo: { aptoFisico: true, fechaApto: '2025-03-01' } });
  const r = await convocar(p, [sin, vencido]);
  assert.equal(r.status, 409);
  assert.equal(r.cuerpo.detalles.length, 2);
  assert.match(r.cuerpo.detalles.join(' '), /no_apto/);
  assert.match(r.cuerpo.detalles.join(' '), /vencido/);
});

test('RN-22: máximo 14 convocados, también si se agregan en tandas', async () => {
  const p = await partido('2026-12-12');
  const ids = [];
  for (let i = 0; i < 15; i++) ids.push(await jugador());
  assert.equal((await convocar(p, ids)).status, 409); // 15 de una vez
  assert.equal((await convocar(p, ids.slice(0, 10))).status, 200);
  const r = await convocar(p, ids.slice(10, 15)); // 10 + 5 = 15
  assert.equal(r.status, 409);
  assert.match(r.cuerpo.detalles.join(' '), /máximo de 14/);
  assert.equal((await convocar(p, ids.slice(10, 14))).status, 200); // 10 + 4 = 14
  assert.equal((await t.llamar('GET', `/api/partidos/${p}`, { rol: 'medico' })).cuerpo.convocados.length, 14);
});

test('RN-23: un jugador no puede estar en dos partidos de la misma fecha, pero sí en fechas distintas', async () => {
  const p1 = await partido('2026-12-19'); const p2 = await partido('2026-12-19'); const p3 = await partido('2026-12-26');
  const j = await jugador();
  assert.equal((await convocar(p1, [j])).status, 200);
  const r = await convocar(p2, [j]);
  assert.equal(r.status, 409);
  assert.match(r.cuerpo.detalles[0], /misma fecha/);
  assert.equal((await convocar(p3, [j])).status, 200);
});

test('RN-24: no se modifica la convocatoria de un partido que ya se jugó', async () => {
  const j = await jugador();
  const fila = await t.pool.query("INSERT INTO partidos (division, rival, lugar, fecha) VALUES ('primera','Viejo','Cancha','2026-10-01') RETURNING id");
  const pasado = fila.rows[0].id;
  await t.pool.query('INSERT INTO convocatorias (partido_id, jugador_id) VALUES ($1, $2)', [pasado, j]);
  assert.equal((await convocar(pasado, [await jugador()])).status, 409);
  assert.equal((await t.llamar('DELETE', `/api/partidos/${pasado}/convocatoria/${j}`, { rol: 'tecnico' })).status, 409);
});

test('RN-25: es todo o nada: si uno falla no se guarda ninguno y se informa el motivo', async () => {
  const p = await partido('2027-01-09');
  const bueno = await jugador(); const malo = await jugador('primera', { apto: false });
  const r = await convocar(p, [bueno, malo]);
  assert.equal(r.status, 409);
  assert.equal(r.cuerpo.detalles.length, 1);
  assert.equal((await t.llamar('GET', `/api/partidos/${p}`, { rol: 'medico' })).cuerpo.convocados.length, 0);
});

test('RN-25: convocar de nuevo a un jugador ya convocado se ignora sin error', async () => {
  const p = await partido('2027-01-16'); const j = await jugador();
  await convocar(p, [j]);
  const r = await convocar(p, [j]);
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.convocados.length, 1);
});

test('se puede quitar a un convocado; quitar a quien no está convocado da 404', async () => {
  const p = await partido('2027-01-23'); const j = await jugador();
  await convocar(p, [j]);
  assert.equal((await t.llamar('DELETE', `/api/partidos/${p}/convocatoria/${j}`, { rol: 'tecnico' })).status, 204);
  assert.equal((await t.llamar('DELETE', `/api/partidos/${p}/convocatoria/${j}`, { rol: 'tecnico' })).status, 404);
});

test('elegibles informa quién puede ser convocado y el motivo de quien no', async () => {
  const p = await partido('2027-01-30');
  const ok = await jugador(); const sin = await jugador('primera', { apto: false });
  const lista = (await t.llamar('GET', `/api/partidos/${p}/elegibles`, { rol: 'tecnico' })).cuerpo;
  assert.equal(lista.find((j) => j.id === ok).elegible, true);
  const malo = lista.find((j) => j.id === sin);
  assert.equal(malo.elegible, false);
  assert.match(malo.motivo, /apto físico/);
});

test('la convocatoria valida el pedido y el partido inexistente da 404', async () => {
  const p = await partido('2027-02-06');
  for (const malo of [[], 'x', [1.5], ['a'], null]) assert.equal((await convocar(p, malo)).status, 400, JSON.stringify(malo));
  assert.equal((await convocar(99999, [1])).status, 404);
  assert.equal((await t.llamar('GET', '/api/partidos/abc', { rol: 'medico' })).status, 404);
});

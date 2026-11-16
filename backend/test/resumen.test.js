const test = require('node:test');
const assert = require('node:assert/strict');
const { levantarApp } = require('./helpers');

let t, n = 0;
test.before(async () => { t = await levantarApp(); });
test.after(() => t.cerrar());

async function jugador(division, apellido, { apto, goles, baja, rojas } = {}) {
  n += 1;
  const r = await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: { nombre: `N${n}`, apellido, division, fechaNacimiento: '2000-01-01', altura: 1.8, peso: 75 } });
  const id = r.cuerpo.id;
  if (apto) await t.llamar('PUT', `/api/jugadores/${id}/apto-fisico`, { rol: 'medico', cuerpo: { aptoFisico: true, fechaApto: apto } });
  if (goles) await t.llamar('PATCH', `/api/jugadores/${id}/estadisticas`, { rol: 'tecnico', cuerpo: { goles } });
  if (rojas) await t.llamar('PATCH', `/api/jugadores/${id}/estadisticas`, { rol: 'tecnico', cuerpo: { rojas } });
  if (baja) await t.llamar('DELETE', `/api/jugadores/${id}`, { rol: 'tecnico' });
  return id;
}

test('RN-26: el resumen devuelve las 7 divisiones, también las vacías', async () => {
  const r = await t.llamar('GET', '/api/resumen', { rol: 'medico' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.cuerpo.map((d) => d.division), ['octava', 'septima', 'sexta', 'quinta', 'cuarta', 'tercera', 'primera']);
  assert.deepEqual(r.cuerpo[0], { division: 'octava', total: 0, aptos: 0, vencidos: 0, noAptos: 0, suspendidos: 0, goleadores: [] });
});

test('RN-26: cuenta activos, aptos, vencidos, no aptos y suspendidos, y no cuenta a los dados de baja', async () => {
  await jugador('primera', 'Apto', { apto: '2026-03-01' });
  await jugador('primera', 'Vencido', { apto: '2025-03-01' });
  await jugador('primera', 'Sin');
  await jugador('primera', 'Suspendido', { apto: '2026-03-01', rojas: 1 });
  await jugador('primera', 'Baja', { apto: '2026-03-01', baja: true });
  const d = (await t.llamar('GET', '/api/resumen', { rol: 'tecnico' })).cuerpo.find((x) => x.division === 'primera');
  assert.equal(d.total, 4);
  assert.equal(d.aptos, 2);
  assert.equal(d.vencidos, 1);
  assert.equal(d.noAptos, 1);
  assert.equal(d.suspendidos, 1);
});

test('RN-26: los 3 máximos goleadores salen ordenados y solo con goles mayores a 0', async () => {
  for (const [ap, g] of [['Uno', 9], ['Dos', 7], ['Tres', 5], ['Cuatro', 3], ['Cero', 0]]) await jugador('sexta', ap, { goles: g });
  await jugador('sexta', 'Baja', { goles: 50, baja: true });
  const d = (await t.llamar('GET', '/api/resumen', { rol: 'medico' })).cuerpo.find((x) => x.division === 'sexta');
  assert.deepEqual(d.goleadores.map((x) => [x.apellido, x.goles]), [['Uno', 9], ['Dos', 7], ['Tres', 5]]);
});

test('RN-01: el resumen exige sesión', async () => {
  assert.equal((await t.llamar('GET', '/api/resumen')).status, 401);
});

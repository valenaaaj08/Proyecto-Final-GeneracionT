const test = require('node:test');
const assert = require('node:assert/strict');
const { levantarApp } = require('./helpers');

let t;
test.before(async () => { t = await levantarApp(); });
test.after(() => t.cerrar());

const valido = { nombre: 'Lucas', apellido: 'Pérez', division: 'Séptima', fechaNacimiento: '2012-05-14', altura: 1.6, peso: 52.5 };
const crear = (cuerpo = valido, rol = 'tecnico') => t.llamar('POST', '/api/jugadores', { rol, cuerpo });

test('RN-01: listar jugadores sin sesión devuelve 401', async () => {
  assert.equal((await t.llamar('GET', '/api/jugadores')).status, 401);
});

test('RN-02: el médico no puede dar de alta jugadores (403) pero técnico y admin sí', async () => {
  assert.equal((await crear(valido, 'medico')).status, 403);
  const a = await crear({ ...valido, nombre: 'Ana', apellido: 'Admin' }, 'admin');
  assert.equal(a.status, 201);
});

test('RN-06/RN-10: el alta devuelve el jugador con división normalizada, sin apto y con estadísticas en 0', async () => {
  const r = await crear();
  assert.equal(r.status, 201);
  assert.equal(r.cuerpo.division, 'septima');
  assert.equal(r.cuerpo.estadoApto, 'no_apto');
  assert.equal(r.cuerpo.aptoFisico, false);
  assert.deepEqual([r.cuerpo.goles, r.cuerpo.amarillas, r.cuerpo.rojas, r.cuerpo.asistencias], [0, 0, 0, 0]);
  assert.equal(r.cuerpo.suspendido, false);
});

test('RN-06: datos inválidos devuelven 400 con la lista de errores', async () => {
  const r = await crear({ nombre: 'A', division: 'novena', fechaNacimiento: '2010-02-31', altura: 5, peso: 'mucho' });
  assert.equal(r.status, 400);
  assert.ok(r.cuerpo.detalles.length >= 6);
});

test('RN-06: no acepta fecha de nacimiento futura, altura ni peso fuera de rango', async () => {
  for (const malo of [{ fechaNacimiento: '2027-01-01' }, { altura: 0.9 }, { altura: 2.3 }, { peso: 19 }, { peso: 151 }]) {
    const r = await crear({ ...valido, nombre: 'Prueba', apellido: 'Rango', ...malo });
    assert.equal(r.status, 400, JSON.stringify(malo));
  }
});

test('RN-07: la edad la calcula el servidor e ignora la que manda el cliente', async () => {
  const a = await crear({ ...valido, nombre: 'Edad', apellido: 'Uno', edad: 99 });
  assert.equal(a.cuerpo.edad, 14); // nació 2012-05-14, hoy es 2026-11-16
  const b = await crear({ ...valido, nombre: 'Edad', apellido: 'Dos', fechaNacimiento: '2012-11-17' });
  assert.equal(b.cuerpo.edad, 13); // cumple años mañana
  const c = await crear({ ...valido, nombre: 'Edad', apellido: 'Tres', fechaNacimiento: '2012-11-16' });
  assert.equal(c.cuerpo.edad, 14); // cumple años hoy
});

test('RN-10: el cliente no puede dar un apto ni estadísticas al crear al jugador', async () => {
  const r = await crear({ ...valido, nombre: 'Intento', apellido: 'Trampa', aptoFisico: true, fechaApto: '2026-03-01', goles: 50, suspendido: true });
  assert.equal(r.cuerpo.estadoApto, 'no_apto');
  assert.equal(r.cuerpo.goles, 0);
  assert.equal(r.cuerpo.suspendido, false);
});

test('RN-08: rechaza duplicados con 409, sin distinguir mayúsculas ni tildes', async () => {
  const r = await crear({ ...valido, nombre: 'LUCAS', apellido: 'perez' });
  assert.equal(r.status, 409);
});

test('RN-09: la baja es lógica: desaparece de listados y de consultas, pero la fila se conserva', async () => {
  const j = (await crear({ ...valido, nombre: 'Baja', apellido: 'Prueba' })).cuerpo;
  assert.equal((await t.llamar('DELETE', `/api/jugadores/${j.id}`, { rol: 'tecnico' })).status, 204);
  assert.equal((await t.llamar('GET', `/api/jugadores/${j.id}`, { rol: 'tecnico' })).status, 404);
  const lista = (await t.llamar('GET', '/api/jugadores', { rol: 'tecnico' })).cuerpo;
  assert.ok(!lista.some((x) => x.id === j.id));
  const fila = await t.pool.query('SELECT activo FROM jugadores WHERE id = $1', [j.id]);
  assert.equal(fila.rows[0].activo, false);
});

test('RN-08/RN-09: un jugador dado de baja sigue contando para el control de duplicados', async () => {
  const r = await crear({ ...valido, nombre: 'Baja', apellido: 'Prueba' });
  assert.equal(r.status, 409);
});

test('editar un jugador valida los datos y respeta el duplicado de otro', async () => {
  const a = (await crear({ ...valido, nombre: 'Editar', apellido: 'Uno' })).cuerpo;
  const ok = await t.llamar('PUT', `/api/jugadores/${a.id}`, { rol: 'tecnico', cuerpo: { ...valido, nombre: 'Editar', apellido: 'Uno', peso: 55, division: 'sexta' } });
  assert.equal(ok.status, 200);
  assert.equal(ok.cuerpo.division, 'sexta');
  assert.equal(ok.cuerpo.peso, 55);
  const choque = await t.llamar('PUT', `/api/jugadores/${a.id}`, { rol: 'tecnico', cuerpo: valido }); // datos de Lucas Pérez
  assert.equal(choque.status, 409);
  assert.equal((await t.llamar('PUT', `/api/jugadores/${a.id}`, { rol: 'tecnico', cuerpo: { ...valido, peso: 5 } })).status, 400);
});

test('listar filtra por división y por nombre; filtros inválidos dan 400; id inexistente da 404', async () => {
  const sexta = (await t.llamar('GET', '/api/jugadores?division=Sexta', { rol: 'medico' })).cuerpo;
  assert.ok(sexta.length >= 1 && sexta.every((j) => j.division === 'sexta'));
  const porNombre = (await t.llamar('GET', '/api/jugadores?nombre=perez', { rol: 'medico' })).cuerpo;
  assert.ok(porNombre.some((j) => j.apellido === 'Pérez'));
  assert.equal((await t.llamar('GET', '/api/jugadores?division=novena', { rol: 'medico' })).status, 400);
  assert.equal((await t.llamar('GET', '/api/jugadores?estadoApto=raro', { rol: 'medico' })).status, 400);
  assert.equal((await t.llamar('GET', '/api/jugadores/99999', { rol: 'medico' })).status, 404);
  assert.equal((await t.llamar('GET', '/api/jugadores/abc', { rol: 'medico' })).status, 404);
});

test('GET /api/divisiones devuelve las 7 divisiones', async () => {
  const r = await t.llamar('GET', '/api/divisiones', { rol: 'medico' });
  assert.deepEqual(r.cuerpo, ['octava', 'septima', 'sexta', 'quinta', 'cuarta', 'tercera', 'primera']);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { levantarApp, CLAVE_DE_PRUEBA, SECRETO_DE_PRUEBA } = require('./helpers');
const { requiereRol } = require('../src/middleware/auth');

let t;
test.before(async () => { t = await levantarApp(); });
test.after(() => t.cerrar());

test('GET /api/health responde sin sesión', async () => {
  const r = await t.llamar('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.cuerpo.estado, 'ok');
});

test('RN-01: sin token se rechaza con 401', async () => {
  const r = await t.llamar('GET', '/api/auth/me');
  assert.equal(r.status, 401);
});

test('RN-01: un token inválido se rechaza con 401', async () => {
  const r = await t.llamar('GET', '/api/auth/me', { token: 'esto-no-es-un-token' });
  assert.equal(r.status, 401);
});

test('RN-01: un token firmado con otra clave se rechaza con 401', async () => {
  const falso = jwt.sign({ sub: 1, nombre: 'x', rol: 'admin' }, 'otra-clave-distinta-de-32-caracteres-xx');
  assert.equal((await t.llamar('GET', '/api/auth/me', { token: falso })).status, 401);
});

test('RN-02: requiereRol deja pasar al rol permitido y rechaza con 403 a otro', () => {
  const mw = requiereRol('admin', 'medico');
  let resultado;
  mw({ usuario: { rol: 'medico' } }, {}, (e) => { resultado = e; });
  assert.equal(resultado, undefined);
  mw({ usuario: { rol: 'tecnico' } }, {}, (e) => { resultado = e; });
  assert.equal(resultado.status, 403);
});

test('inicio de sesión correcto devuelve token y el usuario', async () => {
  const r = await t.llamar('POST', '/api/auth/login', { cuerpo: { email: 'tecnico@test.com', password: CLAVE_DE_PRUEBA } });
  assert.equal(r.status, 200);
  assert.ok(r.cuerpo.token);
  assert.equal(r.cuerpo.usuario.rol, 'tecnico');
  const yo = await t.llamar('GET', '/api/auth/me', { token: r.cuerpo.token });
  assert.equal(yo.status, 200);
  assert.equal(yo.cuerpo.usuario.rol, 'tecnico');
});

test('RN-03: email inexistente y contraseña incorrecta dan exactamente la misma respuesta', async () => {
  const a = await t.llamar('POST', '/api/auth/login', { cuerpo: { email: 'nadie@test.com', password: 'lo-que-sea' } });
  const b = await t.llamar('POST', '/api/auth/login', { cuerpo: { email: 'admin@test.com', password: 'incorrecta' } });
  assert.equal(a.status, 401);
  assert.deepEqual(a.cuerpo, b.cuerpo);
  assert.equal(a.cuerpo.error, 'Credenciales inválidas');
});

test('RN-03: la contraseña se guarda con hash, no en texto plano', async () => {
  const r = await t.pool.query("SELECT password_hash FROM usuarios WHERE email = 'admin@test.com'");
  assert.notEqual(r.rows[0].password_hash, CLAVE_DE_PRUEBA);
  assert.match(r.rows[0].password_hash, /^\$2[aby]\$/);
});

test('RN-04: la sesión dura 8 horas', async () => {
  const token = await t.tokenDe('admin');
  const datos = jwt.verify(token, SECRETO_DE_PRUEBA);
  assert.equal(datos.exp - datos.iat, 8 * 60 * 60);
});

test('RN-05: ninguna respuesta de autenticación incluye el hash', async () => {
  const r = await t.llamar('POST', '/api/auth/login', { cuerpo: { email: 'admin@test.com', password: CLAVE_DE_PRUEBA } });
  assert.ok(!JSON.stringify(r.cuerpo).includes('password'));
});

test('el inicio de sesión sin datos devuelve 400', async () => {
  assert.equal((await t.llamar('POST', '/api/auth/login', { cuerpo: {} })).status, 400);
  assert.equal((await t.llamar('POST', '/api/auth/login')).status, 400);
});

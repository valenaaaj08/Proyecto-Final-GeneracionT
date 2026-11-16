const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { levantarApp } = require('./helpers');

let t;
test.before(async () => { t = await levantarApp(); });
test.after(() => t.cerrar());

function formatoOk(r) {
  assert.equal(typeof r.cuerpo.error, 'string');
  assert.ok(Array.isArray(r.cuerpo.detalles));
}

test('RN-27: los errores 400, 401, 403, 404 y 409 tienen el formato { error, detalles }', async () => {
  const j = { nombre: 'Error', apellido: 'Formato', division: 'primera', fechaNacimiento: '2000-01-01', altura: 1.8, peso: 70 };
  const casos = [
    [400, await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: {} })],
    [401, await t.llamar('GET', '/api/jugadores')],
    [403, await t.llamar('POST', '/api/jugadores', { rol: 'medico', cuerpo: j })],
    [404, await t.llamar('GET', '/api/jugadores/9999', { rol: 'tecnico' })],
  ];
  await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: j });
  casos.push([409, await t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: j })]);
  for (const [codigo, r] of casos) {
    assert.equal(r.status, codigo);
    formatoOk(r);
  }
});

test('RN-27: un JSON mal formado devuelve 400 y una ruta inexistente 404, con el mismo formato', async () => {
  const mal = await fetch(`${t.base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{esto no es json' });
  assert.equal(mal.status, 400);
  formatoOk({ cuerpo: await mal.json() });
  const r = await t.llamar('GET', '/api/no-existe');
  assert.equal(r.status, 404);
  formatoOk(r);
});

test('RN-28: el repositorio ignora los archivos .env y .env.example no trae secretos', () => {
  const raiz = path.join(__dirname, '../..');
  const gitignore = fs.readFileSync(path.join(raiz, '.gitignore'), 'utf-8');
  assert.match(gitignore, /^\.env$/m);
  const ejemplo = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf-8');
  assert.match(ejemplo, /^JWT_SECRET=\s*$/m);
  assert.match(ejemplo, /USUARIO:CLAVE@HOST/);
  assert.match(ejemplo, /^SEED_ADMIN_PASSWORD=\s*$/m);
});

test('RN-28: el código fuente no tiene claves ni contraseñas escritas', () => {
  const carpeta = path.join(__dirname, '../src');
  const archivos = fs.readdirSync(carpeta, { recursive: true }).filter((f) => f.endsWith('.js'));
  assert.ok(archivos.length > 5);
  for (const f of archivos) {
    const texto = fs.readFileSync(path.join(carpeta, f), 'utf-8');
    assert.doesNotMatch(texto, /postgres(ql)?:\/\/[^\s'"`$]+:[^\s'"`$]+@/i, f);
    assert.doesNotMatch(texto, /(jwt_secret|password)\s*[:=]\s*['"][^'"]{6,}['"]/i, f);
  }
});

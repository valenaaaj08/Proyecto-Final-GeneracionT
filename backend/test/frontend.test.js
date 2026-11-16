// Pruebas del frontend: carga la página real en un navegador simulado (jsdom) y la usa contra la API de pruebas.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { levantarApp, CLAVE_DE_PRUEBA } = require('./helpers');

const CARPETA = path.join(__dirname, '../../frontend');
let t;
const ventanas = [];
test.before(async () => { t = await levantarApp(); });
test.after(() => { ventanas.forEach((w) => w.close()); t.cerrar(); });

function abrirPagina() {
  const html = fs.readFileSync(path.join(CARPETA, 'index.html'), 'utf-8')
    .replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, ruta) => `<script>${fs.readFileSync(path.join(CARPETA, ruta), 'utf-8')}</script>`);
  const dom = new JSDOM(html, {
    url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) { w.fetch = (ruta, op) => fetch(t.base + ruta, op); w.confirm = () => true; },
  });
  ventanas.push(dom.window);
  return dom.window;
}
async function esperar(condicion, mensaje, ms = 4000) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) { if (condicion()) return; await new Promise((r) => setTimeout(r, 25)); }
  assert.fail(`Se esperaba: ${mensaje}`);
}
async function ingresar(rol) {
  const w = abrirPagina();
  const d = w.document;
  assert.equal(d.querySelector('#vista-login').hidden, false);
  d.querySelector('#login-email').value = `${rol}@test.com`;
  d.querySelector('#login-password').value = CLAVE_DE_PRUEBA;
  d.querySelector('#form-login').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(() => !d.querySelector('#vista-app').hidden, 'que se muestre la aplicación');
  return w;
}
const texto = (w, sel) => w.document.querySelector(sel)?.textContent ?? '';
const clic = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const cargarJugador = (nombre, apellido, division = 'primera') => t.llamar('POST', '/api/jugadores', { rol: 'tecnico', cuerpo: { nombre, apellido, division, fechaNacimiento: '2000-01-01', altura: 1.8, peso: 75 } });

test('ingreso con credenciales incorrectas muestra el error y no entra', async () => {
  const w = abrirPagina();
  const d = w.document;
  d.querySelector('#login-email').value = 'admin@test.com';
  d.querySelector('#login-password').value = 'mal';
  d.querySelector('#form-login').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(() => !d.querySelector('#login-aviso').classList.contains('d-none'), 'mensaje de error');
  assert.match(texto(w, '#login-aviso'), /Credenciales inválidas/);
  assert.equal(d.querySelector('#vista-app').hidden, true);
});

test('el técnico ingresa, ve el plantel y puede crear un jugador desde el formulario', async () => {
  await cargarJugador('Valeria', 'Plantel');
  const w = await ingresar('tecnico');
  const d = w.document;
  assert.match(texto(w, '#usuario-rol'), /Técnico/);
  await esperar(() => texto(w, '#tabla').includes('Plantel'), 'la tabla con el jugador cargado');

  clic(w, d.querySelector('#nuevo-jugador'));
  await esperar(() => d.querySelector('#form-jugador'), 'el formulario');
  d.querySelector('#f-nombre').value = 'Nuevo';
  d.querySelector('#f-apellido').value = 'Desdeformulario';
  d.querySelector('#f-nacimiento').value = '2001-02-03';
  d.querySelector('#f-altura').value = '1,75';
  d.querySelector('#f-peso').value = '70.5';
  d.querySelector('#form-jugador').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(() => texto(w, '#tabla').includes('Desdeformulario'), 'el jugador nuevo en la tabla');
  assert.match(texto(w, '#tabla'), /No apto/);
});

test('el formulario muestra los errores que devuelve el backend', async () => {
  const w = await ingresar('tecnico');
  const d = w.document;
  await esperar(() => d.querySelector('#nuevo-jugador'), 'el botón nuevo jugador');
  clic(w, d.querySelector('#nuevo-jugador'));
  await esperar(() => d.querySelector('#form-jugador'), 'el formulario');
  d.querySelector('#form-jugador').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(() => !d.querySelector('#dialogo .js-errores').classList.contains('d-none'), 'los errores en el formulario');
  assert.match(texto(w, '#dialogo .js-errores'), /nombre es obligatorio/);
});

test('el médico no ve los botones de gestión pero sí el de apto físico', async () => {
  await cargarJugador('Marta', 'Medica');
  const w = await ingresar('medico');
  const d = w.document;
  await esperar(() => texto(w, '#tabla').includes('Medica'), 'la tabla');
  assert.equal(d.querySelector('#nuevo-jugador'), null);
  assert.equal(d.querySelector('[data-accion="baja"]'), null);
  assert.ok(d.querySelector('[data-accion="apto"]'));
});

test('el texto de un jugador se muestra como texto y no como HTML (sin inyección)', async () => {
  await cargarJugador('<img src=x onerror=alert(1)>', 'Peligro');
  const w = await ingresar('tecnico');
  await esperar(() => texto(w, '#tabla').includes('Peligro'), 'la tabla');
  assert.equal(w.document.querySelector('#tabla img'), null);
  assert.ok(texto(w, '#tabla').includes('<img src=x'));
});

test('se carga un apto desde el formulario del médico y la tabla lo muestra como "Apto"', async () => {
  const j = (await cargarJugador('Pablo', 'ConApto')).cuerpo;
  const w = await ingresar('medico');
  const d = w.document;
  await esperar(() => texto(w, '#tabla').includes('ConApto'), 'la tabla');
  clic(w, d.querySelector(`[data-accion="apto"][data-id="${j.id}"]`));
  await esperar(() => d.querySelector('#form-apto'), 'el formulario de apto');
  d.querySelector('#a-fecha').value = '2026-03-10';
  d.querySelector('#form-apto').dispatchEvent(new w.Event('submit', { cancelable: true }));
  const badgeApto = () => {
    const fila = [...d.querySelectorAll('#tabla tbody tr')].find((tr) => tr.textContent.includes('ConApto'));
    return fila ? fila.querySelector('.badge').textContent.trim() : '';
  };
  await esperar(() => badgeApto() === 'Apto', 'el badge "Apto" en la fila del jugador');
});

test('partidos: se abre la convocatoria, se elige un jugador y queda convocado', async () => {
  const j = (await cargarJugador('Carlos', 'Convocable', 'cuarta')).cuerpo;
  await t.llamar('PUT', `/api/jugadores/${j.id}/apto-fisico`, { rol: 'medico', cuerpo: { aptoFisico: true, fechaApto: '2026-03-01' } });
  const p = (await t.llamar('POST', '/api/partidos', { rol: 'tecnico', cuerpo: { division: 'cuarta', rival: 'Rival Test', lugar: 'Cancha', fecha: '2026-12-20' } })).cuerpo;
  const w = await ingresar('tecnico');
  const d = w.document;
  clic(w, d.querySelector('[data-vista="partidos"]'));
  await esperar(() => texto(w, '#lista-partidos').includes('Rival Test'), 'el partido en la lista');
  clic(w, d.querySelector(`[data-partido="${p.id}"]`));
  await esperar(() => d.querySelector('#form-convocar'), 'el formulario de convocatoria');
  d.querySelector(`#c-${j.id}`).checked = true;
  d.querySelector('#form-convocar').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await esperar(() => texto(w, '#dialogo').includes('Convocados (1/14)'), 'el jugador convocado');
  const api = (await t.llamar('GET', `/api/partidos/${p.id}`, { rol: 'medico' })).cuerpo;
  assert.equal(api.convocados[0].id, j.id);
});

test('el resumen muestra una tarjeta por división', async () => {
  const w = await ingresar('admin');
  clic(w, w.document.querySelector('[data-vista="resumen"]'));
  await esperar(() => w.document.querySelectorAll('.tarjeta-resumen').length === 7, 'siete tarjetas');
});

test('salir devuelve a la pantalla de ingreso', async () => {
  const w = await ingresar('admin');
  clic(w, w.document.querySelector('#boton-salir'));
  assert.equal(w.document.querySelector('#vista-login').hidden, false);
  assert.equal(w.document.querySelector('#vista-app').hidden, true);
});

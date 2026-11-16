'use strict';
// Frontend del Sistema de Gestión de Planteles de Futsal.
// No contiene reglas de negocio: muestra datos y los envía al backend, que decide (ver docs/SPEC.md).

const API = (window.API_URL || '').replace(/\/$/, '');
const DIVISIONES = ['octava', 'septima', 'sexta', 'quinta', 'cuarta', 'tercera', 'primera'];
const NOMBRE_DIV = { octava: 'Octava', septima: 'Séptima', sexta: 'Sexta', quinta: 'Quinta', cuarta: 'Cuarta', tercera: 'Tercera', primera: 'Primera' };
const ESTADO_APTO = { apto: ['success', 'Apto'], vencido: ['warning', 'Vencido'], no_apto: ['danger', 'No apto'] };
const PERMISOS = { gestion: ['admin', 'tecnico'], apto: ['admin', 'medico'] };
const NOMBRE_ROL = { admin: 'Administrador', tecnico: 'Técnico', medico: 'Médico' };
const MAX_CONVOCADOS = 14;

const $ = (selector) => document.querySelector(selector);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const puede = (permiso) => !!sesion && PERMISOS[permiso].includes(sesion.usuario.rol);
const verFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
const hoyAR = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

let sesion = leerSesion();
const estado = { vista: 'plantel', division: 'primera', busqueda: '', estadoApto: '', divisionPartidos: '' };
let jugadoresActuales = [];

function leerSesion() {
  try { return JSON.parse(sessionStorage.getItem('sesion')); } catch { return null; }
}

// ---------- Comunicación con el backend ----------
class ErrorApi extends Error {
  constructor(mensaje, detalles = [], status = 0) { super(mensaje); this.detalles = detalles; this.status = status; }
}

async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (sesion) headers.Authorization = `Bearer ${sesion.token}`;
  let res;
  try {
    res = await fetch(API + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Si recién estaba inactivo, esperá unos segundos y probá de nuevo.');
  }
  const texto = await res.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!res.ok) {
    if (res.status === 401 && sesion) cerrarSesion('Tu sesión venció. Volvé a ingresar.');
    throw new ErrorApi((datos && datos.error) || 'Error inesperado', (datos && datos.detalles) || [], res.status);
  }
  return datos;
}

// ---------- Utilidades de pantalla ----------
function aviso(texto, tipo = 'success') {
  const div = document.createElement('div');
  div.className = `alert alert-${tipo} shadow-sm mb-0`;
  div.textContent = texto;
  $('#avisos').appendChild(div);
  setTimeout(() => div.remove(), 4500);
}

function htmlErrores(e) {
  const lista = (e.detalles || []).map((d) => `<li>${esc(d)}</li>`).join('');
  return `<strong>${esc(e.message)}</strong>${lista ? `<ul class="mb-0 mt-1">${lista}</ul>` : ''}`;
}

function abrirDialogo(titulo, cuerpoHtml) {
  const d = $('#dialogo');
  d.innerHTML = `<div class="d-flex justify-content-between align-items-center p-3 border-bottom">
      <h2 class="h5 mb-0">${esc(titulo)}</h2><button type="button" class="btn-close" data-cerrar aria-label="Cerrar"></button></div>
    <div class="p-3">${cuerpoHtml}</div>`;
  d.querySelector('[data-cerrar]').onclick = cerrarDialogo;
  if (!d.open) (d.showModal ? d.showModal() : d.setAttribute('open', ''));
  return d;
}
function cerrarDialogo() {
  const d = $('#dialogo');
  if (d.close) d.close(); else d.removeAttribute('open');
}
function errorEnDialogo(e) {
  const caja = $('#dialogo .js-errores');
  caja.innerHTML = htmlErrores(e);
  caja.classList.remove('d-none');
}
const cajaErrores = '<div class="alert alert-danger d-none js-errores" role="alert"></div>';

// ---------- Sesión ----------
function mostrarLogin(mensaje) {
  $('#vista-app').hidden = true;
  $('#vista-login').hidden = false;
  const caja = $('#login-aviso');
  caja.textContent = mensaje || '';
  caja.classList.toggle('d-none', !mensaje);
}

function mostrarApp() {
  $('#vista-login').hidden = true;
  $('#vista-app').hidden = false;
  $('#usuario-nombre').textContent = sesion.usuario.nombre;
  $('#usuario-rol').textContent = NOMBRE_ROL[sesion.usuario.rol] || sesion.usuario.rol;
  mostrarVista(estado.vista);
}

function cerrarSesion(mensaje) {
  sesion = null;
  sessionStorage.removeItem('sesion');
  cerrarDialogo();
  mostrarLogin(mensaje);
}

$('#form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const boton = $('#login-boton');
  boton.disabled = true;
  boton.textContent = 'Ingresando…';
  try {
    const r = await api('/api/auth/login', { metodo: 'POST', cuerpo: { email: $('#login-email').value, password: $('#login-password').value } });
    sesion = r;
    sessionStorage.setItem('sesion', JSON.stringify(r));
    $('#login-password').value = '';
    mostrarApp();
  } catch (e) {
    mostrarLogin(e.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Ingresar';
  }
});
$('#boton-salir').addEventListener('click', () => cerrarSesion());

// ---------- Navegación ----------
$('#pestanias').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-vista]');
  if (b) mostrarVista(b.dataset.vista);
});

function mostrarVista(vista) {
  estado.vista = vista;
  document.querySelectorAll('#pestanias .nav-link').forEach((b) => b.classList.toggle('active', b.dataset.vista === vista));
  $('#contenido').innerHTML = '<p class="text-muted">Cargando…</p>';
  const vistas = { plantel: vistaPlantel, partidos: vistaPartidos, resumen: vistaResumen };
  vistas[vista]().catch((e) => { $('#contenido').innerHTML = `<div class="alert alert-danger">${htmlErrores(e)}</div>`; });
}

// ---------- Plantel ----------
async function vistaPlantel() {
  $('#contenido').innerHTML = `
    <div class="d-flex flex-wrap gap-2 mb-3" id="pastillas">
      ${DIVISIONES.map((d) => `<button type="button" class="btn btn-sm ${d === estado.division ? 'btn-primary' : 'btn-outline-primary'}" data-division="${d}">${NOMBRE_DIV[d]}</button>`).join('')}
    </div>
    <div class="row g-2 mb-3">
      <div class="col-12 col-md-5"><input id="busqueda" class="form-control" placeholder="Buscar por nombre o apellido" aria-label="Buscar" value="${esc(estado.busqueda)}"></div>
      <div class="col-7 col-md-3">
        <select id="filtro-apto" class="form-select" aria-label="Estado del apto">
          <option value="">Todos los aptos</option>
          ${Object.entries(ESTADO_APTO).map(([v, [, t]]) => `<option value="${v}" ${estado.estadoApto === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="col-5 col-md-4 text-end">${puede('gestion') ? '<button id="nuevo-jugador" type="button" class="btn btn-success">Nuevo jugador</button>' : ''}</div>
    </div>
    <div id="tabla"></div>`;

  $('#pastillas').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-division]');
    if (!b) return;
    estado.division = b.dataset.division;
    vistaPlantel();
  });
  let espera;
  $('#busqueda').addEventListener('input', (ev) => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.busqueda = ev.target.value; cargarTabla(); }, 300);
  });
  $('#filtro-apto').addEventListener('change', (ev) => { estado.estadoApto = ev.target.value; cargarTabla(); });
  const nuevo = $('#nuevo-jugador');
  if (nuevo) nuevo.addEventListener('click', () => dialogoJugador());
  $('#tabla').addEventListener('click', clicEnTabla);
  await cargarTabla();
}

async function cargarTabla() {
  const q = new URLSearchParams({ division: estado.division });
  if (estado.busqueda.trim()) q.set('nombre', estado.busqueda.trim());
  if (estado.estadoApto) q.set('estadoApto', estado.estadoApto);
  const caja = $('#tabla');
  try {
    jugadoresActuales = await api(`/api/jugadores?${q}`);
  } catch (e) { caja.innerHTML = `<div class="alert alert-danger">${htmlErrores(e)}</div>`; return; }
  if (!jugadoresActuales.length) { caja.innerHTML = '<p class="text-muted">No hay jugadores para mostrar.</p>'; return; }
  caja.innerHTML = `<div class="table-responsive bg-white rounded shadow-sm"><table class="table table-hover mb-0 tabla-plantel">
    <thead><tr><th>Jugador</th><th>Nacimiento</th><th>Edad</th><th>Altura</th><th>Peso</th><th>Apto físico</th>
      <th>Goles</th><th>Amar.</th><th>Rojas</th><th>Asist.</th><th>Estado</th><th></th></tr></thead>
    <tbody>${jugadoresActuales.map(filaJugador).join('')}</tbody></table></div>`;
}

function filaJugador(j) {
  const [color, texto] = ESTADO_APTO[j.estadoApto];
  const botones = [];
  if (puede('gestion')) botones.push(['editar', 'Editar', 'secondary'], ['estadisticas', 'Estadísticas', 'primary']);
  if (puede('apto')) botones.push(['apto', 'Apto físico', 'info']);
  if (puede('gestion') && j.suspendido) botones.push(['rehabilitar', 'Rehabilitar', 'warning']);
  if (puede('gestion')) botones.push(['baja', 'Baja', 'danger']);
  return `<tr>
    <td><strong>${esc(j.apellido)}</strong>, ${esc(j.nombre)}</td><td>${verFecha(j.fechaNacimiento)}</td><td>${j.edad}</td>
    <td>${j.altura.toFixed(2)} m</td><td>${j.peso} kg</td>
    <td><span class="badge text-bg-${color}">${texto}</span>${j.aptoFisico ? ` <small class="text-muted">${verFecha(j.fechaApto)}</small>` : ''}</td>
    <td>${j.goles}</td><td>${j.amarillas}</td><td>${j.rojas}</td><td>${j.asistencias}</td>
    <td>${j.suspendido ? '<span class="badge text-bg-danger">Suspendido</span>' : '<span class="badge text-bg-light border">Habilitado</span>'}</td>
    <td><div class="acciones">${botones.map(([a, t, c]) => `<button type="button" class="btn btn-sm btn-outline-${c}" data-accion="${a}" data-id="${j.id}">${t}</button>`).join('')}</div></td></tr>`;
}

async function clicEnTabla(ev) {
  const b = ev.target.closest('[data-accion]');
  if (!b) return;
  const j = jugadoresActuales.find((x) => x.id === Number(b.dataset.id));
  if (!j) return;
  const nombre = `${j.nombre} ${j.apellido}`;
  try {
    if (b.dataset.accion === 'editar') dialogoJugador(j);
    if (b.dataset.accion === 'estadisticas') dialogoEstadisticas(j);
    if (b.dataset.accion === 'apto') dialogoApto(j);
    if (b.dataset.accion === 'rehabilitar' && confirm(`¿Rehabilitar a ${nombre}? Sus amarillas vuelven a 0.`)) {
      await api(`/api/jugadores/${j.id}/rehabilitar`, { metodo: 'POST' });
      aviso(`${nombre} fue rehabilitado.`); await cargarTabla();
    }
    if (b.dataset.accion === 'baja' && confirm(`¿Dar de baja a ${nombre}? Dejará de aparecer en los listados.`)) {
      await api(`/api/jugadores/${j.id}`, { metodo: 'DELETE' });
      aviso(`${nombre} fue dado de baja.`); await cargarTabla();
    }
  } catch (e) { aviso(e.message + (e.detalles.length ? `: ${e.detalles.join('; ')}` : ''), 'danger'); }
}

function dialogoJugador(j) {
  const v = j || { nombre: '', apellido: '', division: estado.division, fechaNacimiento: '', altura: '', peso: '' };
  const d = abrirDialogo(j ? 'Editar jugador' : 'Nuevo jugador', `${cajaErrores}
    <form id="form-jugador" class="row g-2" novalidate>
      <div class="col-6"><label class="form-label" for="f-nombre">Nombre</label><input id="f-nombre" class="form-control" value="${esc(v.nombre)}"></div>
      <div class="col-6"><label class="form-label" for="f-apellido">Apellido</label><input id="f-apellido" class="form-control" value="${esc(v.apellido)}"></div>
      <div class="col-6"><label class="form-label" for="f-division">División</label>
        <select id="f-division" class="form-select">${DIVISIONES.map((x) => `<option value="${x}" ${x === v.division ? 'selected' : ''}>${NOMBRE_DIV[x]}</option>`).join('')}</select></div>
      <div class="col-6"><label class="form-label" for="f-nacimiento">Fecha de nacimiento</label><input id="f-nacimiento" type="date" class="form-control" value="${esc(v.fechaNacimiento)}"></div>
      <div class="col-6"><label class="form-label" for="f-altura">Altura (m)</label><input id="f-altura" class="form-control" inputmode="decimal" placeholder="1.75" value="${esc(v.altura)}"></div>
      <div class="col-6"><label class="form-label" for="f-peso">Peso (kg)</label><input id="f-peso" class="form-control" inputmode="decimal" placeholder="70.5" value="${esc(v.peso)}"></div>
      <div class="col-12 text-end mt-3"><button type="button" class="btn btn-light" data-cerrar>Cancelar</button> <button type="submit" class="btn btn-primary">Guardar</button></div>
    </form>`);
  d.querySelectorAll('[data-cerrar]').forEach((b) => { b.onclick = cerrarDialogo; });
  const numero = (id) => { const t = $(id).value.trim().replace(',', '.'); return t === '' ? null : Number(t); };
  $('#form-jugador').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const cuerpo = {
      nombre: $('#f-nombre').value, apellido: $('#f-apellido').value, division: $('#f-division').value,
      fechaNacimiento: $('#f-nacimiento').value, altura: numero('#f-altura'), peso: numero('#f-peso'),
    };
    try {
      await api(j ? `/api/jugadores/${j.id}` : '/api/jugadores', { metodo: j ? 'PUT' : 'POST', cuerpo });
      cerrarDialogo();
      aviso(j ? 'Jugador actualizado.' : 'Jugador creado. Falta cargar su apto físico.');
      if (cuerpo.division !== estado.division) estado.division = cuerpo.division;
      if (estado.vista === 'plantel') vistaPlantel();
    } catch (e) { errorEnDialogo(e); }
  });
}

function dialogoEstadisticas(j) {
  const campos = [['goles', 'Goles'], ['amarillas', 'Tarjetas amarillas'], ['rojas', 'Tarjetas rojas'], ['asistencias', 'Asistencias']];
  const d = abrirDialogo(`Estadísticas de ${j.nombre} ${j.apellido}`, `${cajaErrores}
    <p class="text-muted">Lo que cargues se <strong>suma</strong> a lo que ya tiene. Una tarjeta roja o la quinta amarilla suspenden al jugador.</p>
    <form id="form-estadisticas" class="row g-2" novalidate>
      ${campos.map(([c, t]) => `<div class="col-6"><label class="form-label" for="e-${c}">${t} (hoy: ${j[c]})</label><input id="e-${c}" type="number" min="0" step="1" value="0" class="form-control"></div>`).join('')}
      <div class="col-12 text-end mt-3"><button type="button" class="btn btn-light" data-cerrar>Cancelar</button> <button type="submit" class="btn btn-primary">Sumar</button></div>
    </form>`);
  d.querySelectorAll('[data-cerrar]').forEach((b) => { b.onclick = cerrarDialogo; });
  $('#form-estadisticas').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const cuerpo = {};
    for (const [c] of campos) { const n = Number($(`#e-${c}`).value); if (n !== 0) cuerpo[c] = n; }
    try {
      const r = await api(`/api/jugadores/${j.id}/estadisticas`, { metodo: 'PATCH', cuerpo });
      cerrarDialogo();
      aviso(r.suspendido && !j.suspendido ? `${j.nombre} ${j.apellido} quedó suspendido.` : 'Estadísticas actualizadas.', r.suspendido && !j.suspendido ? 'warning' : 'success');
      await cargarTabla();
    } catch (e) { errorEnDialogo(e); }
  });
}

function dialogoApto(j) {
  const d = abrirDialogo(`Apto físico de ${j.nombre} ${j.apellido}`, `${cajaErrores}
    <form id="form-apto" class="row g-2" novalidate>
      <div class="col-12"><label class="form-label" for="a-apto">Estado</label>
        <select id="a-apto" class="form-select"><option value="true" selected>Tiene apto físico</option><option value="false">No tiene apto físico</option></select></div>
      <div class="col-12" id="a-grupo-fecha"><label class="form-label" for="a-fecha">Fecha en que se emitió el apto</label><input id="a-fecha" type="date" class="form-control" value="${esc(j.fechaApto || hoyAR())}"></div>
      <div class="col-12 text-end mt-3"><button type="button" class="btn btn-light" data-cerrar>Cancelar</button> <button type="submit" class="btn btn-primary">Guardar</button></div>
    </form>`);
  d.querySelectorAll('[data-cerrar]').forEach((b) => { b.onclick = cerrarDialogo; });
  const alternar = () => { $('#a-grupo-fecha').hidden = $('#a-apto').value !== 'true'; };
  $('#a-apto').addEventListener('change', alternar); alternar();
  $('#form-apto').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const conApto = $('#a-apto').value === 'true';
    try {
      await api(`/api/jugadores/${j.id}/apto-fisico`, { metodo: 'PUT', cuerpo: conApto ? { aptoFisico: true, fechaApto: $('#a-fecha').value } : { aptoFisico: false } });
      cerrarDialogo(); aviso('Apto físico actualizado.'); await cargarTabla();
    } catch (e) { errorEnDialogo(e); }
  });
}

// ---------- Partidos ----------
async function vistaPartidos() {
  $('#contenido').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-8 col-md-4"><select id="filtro-div" class="form-select" aria-label="División">
        <option value="">Todas las divisiones</option>
        ${DIVISIONES.map((d) => `<option value="${d}" ${estado.divisionPartidos === d ? 'selected' : ''}>${NOMBRE_DIV[d]}</option>`).join('')}</select></div>
      <div class="col-4 col-md-8 text-end">${puede('gestion') ? '<button id="nuevo-partido" type="button" class="btn btn-success">Nuevo partido</button>' : ''}</div>
    </div>
    <div id="lista-partidos" class="row g-3"></div>`;
  $('#filtro-div').addEventListener('change', (ev) => { estado.divisionPartidos = ev.target.value; cargarPartidos(); });
  const nuevo = $('#nuevo-partido');
  if (nuevo) nuevo.addEventListener('click', dialogoPartido);
  await cargarPartidos();
}

async function cargarPartidos() {
  const caja = $('#lista-partidos');
  const partidos = await api('/api/partidos' + (estado.divisionPartidos ? `?division=${estado.divisionPartidos}` : ''));
  if (!partidos.length) { caja.innerHTML = '<p class="text-muted">No hay partidos cargados.</p>'; return; }
  const hoy = hoyAR();
  caja.innerHTML = partidos.map((p) => `<div class="col-12 col-md-6 col-lg-4"><div class="card shadow-sm h-100"><div class="card-body">
      <div class="d-flex justify-content-between"><h3 class="h6">${esc(NOMBRE_DIV[p.division])} vs ${esc(p.rival)}</h3>
        ${p.fecha < hoy ? '<span class="badge text-bg-secondary">Jugado</span>' : '<span class="badge text-bg-primary">Próximo</span>'}</div>
      <p class="mb-1">${verFecha(p.fecha)} · ${esc(p.lugar)}</p>
      <p class="text-muted">Convocados: ${p.convocados}/${MAX_CONVOCADOS}</p>
      <button type="button" class="btn btn-sm btn-outline-primary" data-partido="${p.id}">Convocatoria</button>
    </div></div></div>`).join('');
  caja.onclick = (ev) => { const b = ev.target.closest('[data-partido]'); if (b) dialogoConvocatoria(Number(b.dataset.partido)); };
}

function dialogoPartido() {
  const d = abrirDialogo('Nuevo partido', `${cajaErrores}
    <form id="form-partido" class="row g-2" novalidate>
      <div class="col-6"><label class="form-label" for="p-division">División</label><select id="p-division" class="form-select">${DIVISIONES.map((x) => `<option value="${x}" ${x === (estado.divisionPartidos || 'primera') ? 'selected' : ''}>${NOMBRE_DIV[x]}</option>`).join('')}</select></div>
      <div class="col-6"><label class="form-label" for="p-fecha">Fecha</label><input id="p-fecha" type="date" class="form-control" min="${hoyAR()}"></div>
      <div class="col-6"><label class="form-label" for="p-rival">Rival</label><input id="p-rival" class="form-control"></div>
      <div class="col-6"><label class="form-label" for="p-lugar">Lugar</label><input id="p-lugar" class="form-control"></div>
      <div class="col-12 text-end mt-3"><button type="button" class="btn btn-light" data-cerrar>Cancelar</button> <button type="submit" class="btn btn-primary">Crear partido</button></div>
    </form>`);
  d.querySelectorAll('[data-cerrar]').forEach((b) => { b.onclick = cerrarDialogo; });
  $('#form-partido').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      await api('/api/partidos', { metodo: 'POST', cuerpo: { division: $('#p-division').value, fecha: $('#p-fecha').value, rival: $('#p-rival').value, lugar: $('#p-lugar').value } });
      cerrarDialogo(); aviso('Partido creado.'); await cargarPartidos();
    } catch (e) { errorEnDialogo(e); }
  });
}

async function dialogoConvocatoria(id) {
  const [partido, elegibles] = await Promise.all([api(`/api/partidos/${id}`), api(`/api/partidos/${id}/elegibles`)]);
  const editable = puede('gestion') && partido.fecha >= hoyAR();
  const nombre = (j) => `${esc(j.apellido)}, ${esc(j.nombre)}`;
  const posibles = elegibles.filter((j) => j.elegible);
  const noPosibles = elegibles.filter((j) => !j.elegible && !j.convocado);
  const d = abrirDialogo(`${NOMBRE_DIV[partido.division]} vs ${partido.rival} — ${verFecha(partido.fecha)}`, `${cajaErrores}
    <h3 class="h6">Convocados (${partido.convocados.length}/${MAX_CONVOCADOS})</h3>
    ${partido.convocados.length ? `<ul class="list-group mb-3">${partido.convocados.map((j) => `<li class="list-group-item d-flex justify-content-between align-items-center">${nombre(j)}
        ${editable ? `<button type="button" class="btn btn-sm btn-outline-danger" data-quitar="${j.id}">Quitar</button>` : ''}</li>`).join('')}</ul>` : '<p class="text-muted">Todavía no hay convocados.</p>'}
    ${editable ? `<h3 class="h6">Jugadores que se pueden convocar</h3>
      ${posibles.length ? `<form id="form-convocar"><div class="lista-elegibles border rounded p-2 mb-2">${posibles.map((j) => `<div class="form-check"><input class="form-check-input" type="checkbox" id="c-${j.id}" value="${j.id}"><label class="form-check-label" for="c-${j.id}">${nombre(j)}</label></div>`).join('')}</div>
        <button type="submit" class="btn btn-primary">Convocar seleccionados</button></form>` : '<p class="text-muted">No hay jugadores disponibles en esta división.</p>'}
      ${noPosibles.length ? `<h3 class="h6 mt-3">No disponibles</h3><ul class="small text-muted">${noPosibles.map((j) => `<li>${nombre(j)}: ${esc(j.motivo)}</li>`).join('')}</ul>` : ''}` : '<p class="text-muted">La convocatoria no se puede modificar.</p>'}`);
  d.querySelectorAll('[data-quitar]').forEach((b) => {
    b.onclick = async () => {
      try { await api(`/api/partidos/${id}/convocatoria/${b.dataset.quitar}`, { metodo: 'DELETE' }); await dialogoConvocatoria(id); await cargarPartidos(); }
      catch (e) { errorEnDialogo(e); }
    };
  });
  const form = $('#form-convocar');
  if (form) form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const jugadorIds = [...form.querySelectorAll('input:checked')].map((i) => Number(i.value));
    if (!jugadorIds.length) return errorEnDialogo(new ErrorApi('Elegí al menos un jugador'));
    try {
      await api(`/api/partidos/${id}/convocatoria`, { metodo: 'POST', cuerpo: { jugadorIds } });
      aviso('Convocatoria actualizada.'); await dialogoConvocatoria(id); await cargarPartidos();
    } catch (e) { errorEnDialogo(e); }
  });
}

// ---------- Resumen ----------
async function vistaResumen() {
  const resumen = await api('/api/resumen');
  $('#contenido').innerHTML = `<div class="row g-3">${resumen.map((r) => `<div class="col-12 col-md-6 col-lg-4"><div class="card shadow-sm h-100 tarjeta-resumen"><div class="card-body">
      <h2 class="h5">${NOMBRE_DIV[r.division]} <span class="badge text-bg-dark">${r.total} jugadores</span></h2>
      <p class="mb-2"><span class="badge text-bg-success">${r.aptos} aptos</span> <span class="badge text-bg-warning">${r.vencidos} vencidos</span>
        <span class="badge text-bg-danger">${r.noAptos} sin apto</span> <span class="badge text-bg-secondary">${r.suspendidos} suspendidos</span></p>
      <h3 class="h6">Goleadores</h3>
      ${r.goleadores.length ? `<ol>${r.goleadores.map((g) => `<li>${esc(g.apellido)}, ${esc(g.nombre)} — ${g.goles}</li>`).join('')}</ol>` : '<p class="text-muted mb-0">Sin goles registrados.</p>'}
    </div></div></div>`).join('')}</div>`;
}

// ---------- Inicio ----------
if (sesion) mostrarApp(); else mostrarLogin();

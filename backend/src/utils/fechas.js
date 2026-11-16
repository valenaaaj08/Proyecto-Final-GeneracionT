// Fechas como texto AAAA-MM-DD, siempre en hora de Argentina (así "hoy" no depende de la zona del servidor).
const ZONA = 'America/Argentina/Buenos_Aires';

const sinTildes = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Devuelve el texto si es una fecha real en formato AAAA-MM-DD; si no, null (rechaza 2010-02-31).
function fechaValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const f = new Date(`${texto}T00:00:00Z`);
  return !isNaN(f) && f.toISOString().slice(0, 10) === texto ? texto : null;
}

function hoyISO(ahora) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora());
}

function calcularEdad(fechaNacimiento, hoy) {
  const [an, mn, dn] = fechaNacimiento.split('-').map(Number);
  const [ah, mh, dh] = hoy.split('-').map(Number);
  return ah - an - (mh < mn || (mh === mn && dh < dn) ? 1 : 0);
}

module.exports = { sinTildes, fechaValida, hoyISO, calcularEdad };

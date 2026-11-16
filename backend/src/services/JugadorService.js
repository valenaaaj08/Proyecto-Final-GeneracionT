// SERVICE de jugadores: reglas de negocio y validaciones. No conoce Express ni SQL.
const AppError = require('../errors');
const { DIVISIONES } = require('../config/divisiones');
const { sinTildes, fechaValida, hoyISO, calcularEdad } = require('../utils/fechas');

class JugadorService {
  constructor(repositorio, ahora = () => new Date()) {
    this.repo = repositorio;
    this.ahora = ahora;
  }

  // ---- Reglas calculadas: RN-07 (edad) y RN-11 (estado del apto) ----
  presentar(j) {
    const hoy = hoyISO(this.ahora);
    let estadoApto = 'no_apto';
    if (j.aptoFisico) estadoApto = j.fechaApto.slice(0, 4) < hoy.slice(0, 4) ? 'vencido' : 'apto';
    return { ...j, edad: calcularEdad(j.fechaNacimiento, hoy), estadoApto };
  }

  // RN-06
  validarDatos(d) {
    const errores = [];
    const texto = (v) => typeof v === 'string' && v.trim().length >= 2;
    if (!texto(d.nombre)) errores.push('nombre es obligatorio (mínimo 2 caracteres)');
    if (!texto(d.apellido)) errores.push('apellido es obligatorio (mínimo 2 caracteres)');
    if (!DIVISIONES.includes(sinTildes(d.division ?? ''))) errores.push(`division inválida. Valores permitidos: ${DIVISIONES.join(', ')}`);
    const nac = fechaValida(d.fechaNacimiento);
    if (!nac) errores.push('fechaNacimiento debe tener formato AAAA-MM-DD y ser una fecha real');
    else if (nac > hoyISO(this.ahora)) errores.push('fechaNacimiento no puede ser futura');
    const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
    if (!num(d.altura, 1, 2.2)) errores.push('altura debe ser un número en metros entre 1.00 y 2.20');
    if (!num(d.peso, 20, 150)) errores.push('peso debe ser un número en kilos entre 20 y 150');
    if (errores.length) throw new AppError(400, 'Datos inválidos', errores);
  }

  // RN-08
  async verificarDuplicado(d, idActual = null) {
    const clave = (x) => `${sinTildes(x.nombre)}|${sinTildes(x.apellido)}|${x.fechaNacimiento}`;
    const existentes = await this.repo.todos();
    if (existentes.some((j) => j.id !== idActual && clave(j) === clave(d))) {
      throw new AppError(409, 'Ya existe un jugador con ese nombre, apellido y fecha de nacimiento (puede estar dado de baja)');
    }
  }

  limpiar(d) {
    return {
      nombre: d.nombre.trim(), apellido: d.apellido.trim(), division: sinTildes(d.division),
      fechaNacimiento: d.fechaNacimiento, altura: d.altura, peso: d.peso,
    };
  }

  async cargarActivo(id) {
    const j = Number.isInteger(id) ? await this.repo.porId(id) : null;
    if (!j || !j.activo) throw new AppError(404, 'Jugador no encontrado');
    return j;
  }

  // ---- Casos de uso ----
  async crear(datos) {
    const d = datos && typeof datos === 'object' ? datos : {};
    this.validarDatos(d);
    const limpio = this.limpiar(d); // RN-07 y RN-10: edad, apto y estadísticas enviadas por el cliente se ignoran
    await this.verificarDuplicado(limpio);
    return this.presentar(await this.repo.crear(limpio));
  }

  async listar({ division, estadoApto, nombre } = {}) {
    if (division && !DIVISIONES.includes(sinTildes(division))) {
      throw new AppError(400, `division inválida. Valores permitidos: ${DIVISIONES.join(', ')}`);
    }
    if (estadoApto && !['apto', 'vencido', 'no_apto'].includes(estadoApto)) {
      throw new AppError(400, 'estadoApto inválido. Valores permitidos: apto, vencido, no_apto');
    }
    return (await this.repo.activos())
      .map((j) => this.presentar(j))
      .filter((j) => !division || j.division === sinTildes(division))
      .filter((j) => !estadoApto || j.estadoApto === estadoApto)
      .filter((j) => !nombre || sinTildes(`${j.nombre} ${j.apellido}`).includes(sinTildes(nombre)));
  }

  async obtener(id) {
    return this.presentar(await this.cargarActivo(id));
  }

  async actualizar(id, datos) {
    const actual = await this.cargarActivo(id);
    const d = datos && typeof datos === 'object' ? datos : {};
    this.validarDatos(d);
    const limpio = this.limpiar(d);
    await this.verificarDuplicado(limpio, id);
    return this.presentar(await this.repo.guardar({ ...actual, ...limpio }));
  }

  // RN-09: baja lógica, los datos se conservan
  async darDeBaja(id) {
    const actual = await this.cargarActivo(id);
    await this.repo.guardar({ ...actual, activo: false });
  }
}
module.exports = JugadorService;

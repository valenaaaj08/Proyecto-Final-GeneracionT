// SERVICE de partidos y convocatorias: RN-18 a RN-25.
const AppError = require('../errors');
const { DIVISIONES, MAX_CONVOCADOS } = require('../config/divisiones');
const { sinTildes, fechaValida, hoyISO } = require('../utils/fechas');

class PartidoService {
  constructor(partidos, jugadores, jugadorService, ahora = () => new Date()) {
    this.partidos = partidos;
    this.jugadores = jugadores;
    this.jugadorService = jugadorService; // para calcular el estado del apto con la misma regla (RN-11)
    this.ahora = ahora;
  }

  // RN-18
  async crear(datos) {
    const d = datos && typeof datos === 'object' ? datos : {};
    const errores = [];
    const texto = (v) => typeof v === 'string' && v.trim().length >= 2;
    if (!DIVISIONES.includes(sinTildes(d.division ?? ''))) errores.push(`division inválida. Valores permitidos: ${DIVISIONES.join(', ')}`);
    if (!texto(d.rival)) errores.push('rival es obligatorio (mínimo 2 caracteres)');
    if (!texto(d.lugar)) errores.push('lugar es obligatorio (mínimo 2 caracteres)');
    const fecha = fechaValida(d.fecha);
    if (!fecha) errores.push('fecha debe tener formato AAAA-MM-DD y ser una fecha real');
    else if (fecha < hoyISO(this.ahora)) errores.push('fecha no puede ser anterior a hoy');
    if (errores.length) throw new AppError(400, 'Datos inválidos', errores);
    return this.partidos.crear({ division: sinTildes(d.division), rival: d.rival.trim(), lugar: d.lugar.trim(), fecha });
  }

  async listar({ division } = {}) {
    if (division && !DIVISIONES.includes(sinTildes(division))) throw new AppError(400, `division inválida. Valores permitidos: ${DIVISIONES.join(', ')}`);
    const cuentas = await this.partidos.contarConvocados();
    return (await this.partidos.listar())
      .filter((p) => !division || p.division === sinTildes(division))
      .map((p) => ({ ...p, convocados: cuentas.get(p.id) ?? 0 }));
  }

  async cargarPartido(id) {
    const p = Number.isInteger(id) ? await this.partidos.porId(id) : null;
    if (!p) throw new AppError(404, 'Partido no encontrado');
    return p;
  }

  async obtener(id) {
    const partido = await this.cargarPartido(id);
    const ids = await this.partidos.idsConvocados(id);
    const jugadores = (await this.jugadores.porIds(ids)).map((j) => this.jugadorService.presentar(j));
    return { ...partido, convocados: jugadores };
  }

  // RN-24: un partido pasado ya no admite cambios en la convocatoria
  verificarNoPasado(partido) {
    if (partido.fecha < hoyISO(this.ahora)) throw new AppError(409, 'El partido ya se jugó: no se puede modificar la convocatoria');
  }

  // Motivo por el cual un jugador no puede ser convocado, o null si puede (RN-19, RN-20, RN-21, RN-23)
  motivoNoConvocable(jugador, partido, conflictoDe) {
    if (!jugador || !jugador.activo) return 'no existe o está dado de baja';
    if (jugador.division !== partido.division) return `es de otra división (${jugador.division})`;
    if (jugador.suspendido) return 'está suspendido';
    const { estadoApto } = this.jugadorService.presentar(jugador);
    if (estadoApto !== 'apto') return `no tiene el apto físico vigente (${estadoApto})`;
    if (conflictoDe) return 'ya está convocado a otro partido de la misma fecha';
    return null;
  }

  async elegibles(id) {
    const partido = await this.cargarPartido(id);
    const activos = (await this.jugadores.activos()).filter((j) => j.division === partido.division);
    const convocados = new Set(await this.partidos.idsConvocados(id));
    const conflictos = new Set((await this.partidos.conflictosEnFecha(activos.map((j) => j.id), partido.fecha, id)).map((c) => c.jugador_id));
    return activos.map((j) => {
      const motivo = convocados.has(j.id) ? null : this.motivoNoConvocable(j, partido, conflictos.has(j.id));
      return { ...this.jugadorService.presentar(j), convocado: convocados.has(j.id), elegible: motivo === null, motivo };
    });
  }

  // RN-19 a RN-25. Es todo o nada.
  async convocar(id, jugadorIds) {
    const partido = await this.cargarPartido(id);
    if (!Array.isArray(jugadorIds) || !jugadorIds.length || !jugadorIds.every((x) => Number.isInteger(x) && x > 0)) {
      throw new AppError(400, 'Datos inválidos', ['jugadorIds debe ser una lista de ids (enteros) con al menos un jugador']);
    }
    this.verificarNoPasado(partido);

    const pedidos = [...new Set(jugadorIds)];
    const yaConvocados = new Set(await this.partidos.idsConvocados(id));
    const nuevos = pedidos.filter((x) => !yaConvocados.has(x)); // RN-25: los ya convocados se ignoran
    const porId = new Map((await this.jugadores.porIds(nuevos)).map((j) => [j.id, j]));
    const conflictos = new Set((await this.partidos.conflictosEnFecha(nuevos, partido.fecha, id)).map((c) => c.jugador_id));

    const problemas = [];
    for (const x of nuevos) {
      const j = porId.get(x);
      const motivo = this.motivoNoConvocable(j, partido, conflictos.has(x));
      if (motivo) problemas.push(`${j ? `${j.nombre} ${j.apellido}` : `Jugador ${x}`}: ${motivo}`);
    }
    if (yaConvocados.size + nuevos.length > MAX_CONVOCADOS) {
      problemas.push(`Se superaría el máximo de ${MAX_CONVOCADOS} convocados (hay ${yaConvocados.size} y se agregarían ${nuevos.length})`);
    }
    if (problemas.length) throw new AppError(409, 'No se pudo convocar: no se guardó ningún jugador', problemas);

    await this.partidos.agregarConvocados(id, nuevos);
    return this.obtener(id);
  }

  async quitar(id, jugadorId) {
    const partido = await this.cargarPartido(id);
    this.verificarNoPasado(partido);
    if (!(await this.partidos.quitarConvocado(id, jugadorId))) throw new AppError(404, 'El jugador no está convocado a este partido');
  }
}
module.exports = PartidoService;

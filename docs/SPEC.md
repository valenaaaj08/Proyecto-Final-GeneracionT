# Especificación — Futsal Club

Sistema web para gestionar los planteles de un club de futsal: jugadores de las 7 divisiones (octava, séptima, sexta, quinta, cuarta, tercera y primera), control del apto físico anual, estadísticas, suspensiones y convocatorias a partidos.

Cada regla tiene un código **RN-xx**. Los tests y la documentación se refieren a estos códigos.

## Roles y permisos

| Acción | admin | tecnico | medico |
|---|:-:|:-:|:-:|
| Ver jugadores, partidos y resumen | sí | sí | sí |
| Alta, edición y baja de jugadores | sí | sí | no |
| Registrar estadísticas / rehabilitar | sí | sí | no |
| Cargar apto físico | sí | no | sí |
| Crear partidos y convocar | sí | sí | no |

## Acceso y seguridad

- **RN-01** Toda operación, excepto el inicio de sesión y `GET /api/health`, requiere una sesión válida. Sin sesión: 401.
- **RN-02** Cada operación exige el rol indicado en la tabla de permisos. Con sesión pero sin permiso: 403.
- **RN-03** Las contraseñas se guardan con hash (nunca en texto plano). Si el email no existe o la contraseña es incorrecta, la respuesta es la misma (401, «Credenciales inválidas»).
- **RN-04** La sesión expira a las 8 horas.
- **RN-05** Las respuestas nunca incluyen el hash de la contraseña.

## Jugadores

- **RN-06** Datos obligatorios del jugador: `nombre` y `apellido` (mínimo 2 caracteres), `division` (una de las 7), `fechaNacimiento` (AAAA-MM-DD, fecha real y no futura), `altura` (1.00 a 2.20 m) y `peso` (20 a 150 kg).
- **RN-07** La edad se calcula en el servidor a partir de la fecha de nacimiento. Si el cliente envía una edad, se ignora.
- **RN-08** No puede haber dos jugadores con el mismo nombre, apellido y fecha de nacimiento (sin distinguir mayúsculas ni tildes), **incluso si el jugador existente está dado de baja**. Si ocurre: 409.
- **RN-09** La baja es lógica: el jugador queda `activo = false`, deja de aparecer en los listados y no puede ser convocado, pero sus datos se conservan.
- **RN-10** Un jugador nuevo se crea con estadísticas en 0, sin apto físico (`no_apto`) y sin suspensión.

## Apto físico

- **RN-11** Estado del apto: `apto` (apto cargado en el año en curso), `vencido` (apto cargado en un año anterior) y `no_apto` (sin apto). Se calcula siempre al consultar.
- **RN-12** Para marcar apto físico hay que indicar `fechaApto` (AAAA-MM-DD, real y no futura).
- **RN-13** Solo `admin` y `medico` pueden cargar o quitar el apto físico.

## Estadísticas y suspensión

- **RN-14** Las estadísticas (goles, amarillas, rojas, asistencias) solo se incrementan, con enteros mayores o iguales a 1. No se pueden restar ni sobrescribir.
- **RN-15** No se registran estadísticas a un jugador dado de baja.
- **RN-16** Un jugador queda suspendido automáticamente al recibir una tarjeta roja o al acumular 5 amarillas.
- **RN-17** Rehabilitar a un jugador suspendido quita la suspensión y pone sus amarillas en 0; las rojas se conservan. Si el jugador no está suspendido: 409.

## Partidos y convocatorias

- **RN-18** Un partido tiene división, rival, lugar y fecha. La fecha no puede ser anterior a hoy.
- **RN-19** Solo se puede convocar a jugadores activos de la misma división del partido.
- **RN-20** No se puede convocar a un jugador suspendido.
- **RN-21** No se puede convocar a un jugador cuyo apto físico no esté en estado `apto` (es decir, `no_apto` o `vencido`).
- **RN-22** Máximo 14 convocados por partido.
- **RN-23** Un jugador no puede estar convocado a dos partidos con la misma fecha.
- **RN-24** No se puede modificar la convocatoria de un partido cuya fecha ya pasó.
- **RN-25** Convocar es todo o nada: si algún jugador no cumple, no se guarda ninguno y la respuesta indica el motivo de cada uno (409). Si un jugador ya estaba convocado, se ignora sin error.

## Panel y errores

- **RN-26** El resumen por división informa: jugadores activos, aptos, vencidos, no aptos, suspendidos y los 3 máximos goleadores (solo con goles mayores a 0).
- **RN-27** Los errores tienen el formato `{ "error": "mensaje", "detalles": [] }` con los códigos 400 (datos inválidos), 401, 403, 404 y 409 (conflicto con una regla).
- **RN-28** Los secretos (clave de la base, clave de firma de sesiones, contraseñas iniciales) solo se configuran con variables de entorno; nunca se suben al repositorio.

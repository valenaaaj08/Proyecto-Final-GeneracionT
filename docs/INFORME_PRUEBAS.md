# Informe de pruebas

Generado automáticamente por `npm run informe` el **2026-11-17** con Node v22.23.4.

## Resumen

| Dato | Resultado |
|---|---|
| Pruebas ejecutadas | 75 |
| Aprobadas | 75 |
| Fallidas | 0 |
| Duración | 10.1 s |
| Reglas de negocio en la spec | 28 |
| Reglas con al menos una prueba | 28 de 28 |

**Veredicto: todas las pruebas pasan y todas las reglas de la especificación están cubiertas.**

## Cómo se ejecutaron

- Comando: `cd backend && npm test` (usa el ejecutor de pruebas integrado de Node, `node --test`).
- **Base de datos:** PostgreSQL simulado en memoria con `pg-mem`, con el mismo esquema (`backend/db/schema.sql`) que producción. Cada archivo de pruebas arranca su propia base vacía.
- **API:** se levanta el servidor Express real en un puerto libre y se lo llama por HTTP con `fetch`, con un usuario de cada rol (admin, técnico y médico).
- **Fecha:** las pruebas fijan «hoy» en 2026-11-16 para que los resultados no dependan del día en que se ejecutan.
- **Frontend:** `backend/test/frontend.test.js` carga la página real (`frontend/index.html` con sus scripts) en un navegador simulado (jsdom) y usa la interfaz contra la API: ingresar, crear jugadores, cargar apto, convocar, ver el resumen y salir.

## Cobertura de reglas de negocio

| Regla | Descripción | Pruebas | Resultado |
|---|---|:-:|:-:|
| RN-01 | Toda operación, excepto el inicio de sesión y `GET /api/health`, requiere una sesión válida. Sin sesión: 401. | 5 | Aprobada |
| RN-02 | Cada operación exige el rol indicado en la tabla de permisos. Con sesión pero sin permiso: 403. | 4 | Aprobada |
| RN-03 | Las contraseñas se guardan con hash (nunca en texto plano). Si el email no existe o la contraseña es incorr… | 2 | Aprobada |
| RN-04 | La sesión expira a las 8 horas. | 1 | Aprobada |
| RN-05 | Las respuestas nunca incluyen el hash de la contraseña. | 1 | Aprobada |
| RN-06 | Datos obligatorios del jugador: `nombre` y `apellido` (mínimo 2 caracteres), `division` (una de las 7), `fe… | 3 | Aprobada |
| RN-07 | La edad se calcula en el servidor a partir de la fecha de nacimiento. Si el cliente envía una edad, se ignora. | 1 | Aprobada |
| RN-08 | No puede haber dos jugadores con el mismo nombre, apellido y fecha de nacimiento (sin distinguir mayúsculas… | 3 | Aprobada |
| RN-09 | La baja es lógica: el jugador queda `activo = false`, deja de aparecer en los listados y no puede ser convo… | 2 | Aprobada |
| RN-10 | Un jugador nuevo se crea con estadísticas en 0, sin apto físico (`no_apto`) y sin suspensión. | 2 | Aprobada |
| RN-11 | Estado del apto: `apto` (apto cargado en el año en curso), `vencido` (apto cargado en un año anterior) y `n… | 4 | Aprobada |
| RN-12 | Para marcar apto físico hay que indicar `fechaApto` (AAAA-MM-DD, real y no futura). | 1 | Aprobada |
| RN-13 | Solo `admin` y `medico` pueden cargar o quitar el apto físico. | 1 | Aprobada |
| RN-14 | Las estadísticas (goles, amarillas, rojas, asistencias) solo se incrementan, con enteros mayores o iguales … | 2 | Aprobada |
| RN-15 | No se registran estadísticas a un jugador dado de baja. | 1 | Aprobada |
| RN-16 | Un jugador queda suspendido automáticamente al recibir una tarjeta roja o al acumular 5 amarillas. | 2 | Aprobada |
| RN-17 | Rehabilitar a un jugador suspendido quita la suspensión y pone sus amarillas en 0; las rojas se conservan. … | 3 | Aprobada |
| RN-18 | Un partido tiene división, rival, lugar y fecha. La fecha no puede ser anterior a hoy. | 2 | Aprobada |
| RN-19 | Solo se puede convocar a jugadores activos de la misma división del partido. | 1 | Aprobada |
| RN-20 | No se puede convocar a un jugador suspendido. | 1 | Aprobada |
| RN-21 | No se puede convocar a un jugador cuyo apto físico no esté en estado `apto` (es decir, `no_apto` o `vencido`). | 1 | Aprobada |
| RN-22 | Máximo 14 convocados por partido. | 1 | Aprobada |
| RN-23 | Un jugador no puede estar convocado a dos partidos con la misma fecha. | 1 | Aprobada |
| RN-24 | No se puede modificar la convocatoria de un partido cuya fecha ya pasó. | 1 | Aprobada |
| RN-25 | Convocar es todo o nada: si algún jugador no cumple, no se guarda ninguno y la respuesta indica el motivo d… | 2 | Aprobada |
| RN-26 | El resumen por división informa: jugadores activos, aptos, vencidos, no aptos, suspendidos y los 3 máximos … | 3 | Aprobada |
| RN-27 | Los errores tienen el formato `{ "error": "mensaje", "detalles": [] }` con los códigos 400 (datos inválidos… | 2 | Aprobada |
| RN-28 | Los secretos (clave de la base, clave de firma de sesiones, contraseñas iniciales) solo se configuran con v… | 2 | Aprobada |

## Detalle de todas las pruebas

| N° | Prueba | Resultado |
|--:|---|:-:|
| 1 | RN-13: solo admin y médico cargan el apto físico; el técnico recibe 403 | Aprobada |
| 2 | RN-11: un apto cargado este año figura como "apto" | Aprobada |
| 3 | RN-11: un apto de un año anterior figura como "vencido" | Aprobada |
| 4 | RN-11: sin apto figura como "no_apto" y se borra la fecha | Aprobada |
| 5 | RN-12: marcar apto exige una fecha real y no futura | Aprobada |
| 6 | RN-11: el listado filtra por estado del apto | Aprobada |
| 7 | cargar el apto de un jugador inexistente devuelve 404 | Aprobada |
| 8 | GET /api/health responde sin sesión | Aprobada |
| 9 | RN-01: sin token se rechaza con 401 | Aprobada |
| 10 | RN-01: un token inválido se rechaza con 401 | Aprobada |
| 11 | RN-01: un token firmado con otra clave se rechaza con 401 | Aprobada |
| 12 | RN-02: requiereRol deja pasar al rol permitido y rechaza con 403 a otro | Aprobada |
| 13 | inicio de sesión correcto devuelve token y el usuario | Aprobada |
| 14 | RN-03: email inexistente y contraseña incorrecta dan exactamente la misma respuesta | Aprobada |
| 15 | RN-03: la contraseña se guarda con hash, no en texto plano | Aprobada |
| 16 | RN-04: la sesión dura 8 horas | Aprobada |
| 17 | RN-05: ninguna respuesta de autenticación incluye el hash | Aprobada |
| 18 | el inicio de sesión sin datos devuelve 400 | Aprobada |
| 19 | T2: el esquema crea las cuatro tablas | Aprobada |
| 20 | T2: la base rechaza jugadores duplicados (respaldo de RN-08) | Aprobada |
| 21 | T2: la base rechaza roles inexistentes | Aprobada |
| 22 | RN-27: los errores 400, 401, 403, 404 y 409 tienen el formato { error, detalles } | Aprobada |
| 23 | RN-27: un JSON mal formado devuelve 400 y una ruta inexistente 404, con el mismo formato | Aprobada |
| 24 | RN-28: el repositorio ignora los archivos .env y .env.example no trae secretos | Aprobada |
| 25 | RN-28: el código fuente no tiene claves ni contraseñas escritas | Aprobada |
| 26 | RN-14: las estadísticas se suman a lo que ya había | Aprobada |
| 27 | RN-14: no se aceptan ceros, negativos, decimales ni textos, ni un pedido vacío | Aprobada |
| 28 | RN-02: el médico no puede registrar estadísticas (403) | Aprobada |
| 29 | RN-15: no se registran estadísticas a un jugador dado de baja | Aprobada |
| 30 | RN-16: una tarjeta roja suspende al jugador | Aprobada |
| 31 | RN-16: 4 amarillas no suspenden, la quinta sí | Aprobada |
| 32 | RN-17: rehabilitar quita la suspensión, pone las amarillas en 0 y conserva las rojas | Aprobada |
| 33 | RN-17: rehabilitar a un jugador que no está suspendido devuelve 409 | Aprobada |
| 34 | RN-17: el médico no puede rehabilitar (403) | Aprobada |
| 35 | ingreso con credenciales incorrectas muestra el error y no entra | Aprobada |
| 36 | el técnico ingresa, ve el plantel y puede crear un jugador desde el formulario | Aprobada |
| 37 | el formulario muestra los errores que devuelve el backend | Aprobada |
| 38 | el médico no ve los botones de gestión pero sí el de apto físico | Aprobada |
| 39 | el texto de un jugador se muestra como texto y no como HTML (sin inyección) | Aprobada |
| 40 | se carga un apto desde el formulario del médico y la tabla lo muestra como "Apto" | Aprobada |
| 41 | partidos: se abre la convocatoria, se elige un jugador y queda convocado | Aprobada |
| 42 | el resumen muestra una tarjeta por división | Aprobada |
| 43 | salir devuelve a la pantalla de ingreso | Aprobada |
| 44 | RN-01: listar jugadores sin sesión devuelve 401 | Aprobada |
| 45 | RN-02: el médico no puede dar de alta jugadores (403) pero técnico y admin sí | Aprobada |
| 46 | RN-06/RN-10: el alta devuelve el jugador con división normalizada, sin apto y con estadísticas en 0 | Aprobada |
| 47 | RN-06: datos inválidos devuelven 400 con la lista de errores | Aprobada |
| 48 | RN-06: no acepta fecha de nacimiento futura, altura ni peso fuera de rango | Aprobada |
| 49 | RN-07: la edad la calcula el servidor e ignora la que manda el cliente | Aprobada |
| 50 | RN-10: el cliente no puede dar un apto ni estadísticas al crear al jugador | Aprobada |
| 51 | RN-08: rechaza duplicados con 409, sin distinguir mayúsculas ni tildes | Aprobada |
| 52 | RN-09: la baja es lógica: desaparece de listados y de consultas, pero la fila se conserva | Aprobada |
| 53 | RN-08/RN-09: un jugador dado de baja sigue contando para el control de duplicados | Aprobada |
| 54 | editar un jugador valida los datos y respeta el duplicado de otro | Aprobada |
| 55 | listar filtra por división y por nombre; filtros inválidos dan 400; id inexistente da 404 | Aprobada |
| 56 | GET /api/divisiones devuelve las 7 divisiones | Aprobada |
| 57 | RN-18: se crea un partido con división, rival, lugar y fecha futura (o de hoy) | Aprobada |
| 58 | RN-18: una fecha pasada, una división inválida o datos faltantes devuelven 400 | Aprobada |
| 59 | RN-02: el médico no puede crear partidos ni convocar (403) | Aprobada |
| 60 | se convoca a jugadores elegibles y el partido los lista | Aprobada |
| 61 | RN-19: no se convoca a jugadores de otra división ni dados de baja | Aprobada |
| 62 | RN-20: no se convoca a un jugador suspendido | Aprobada |
| 63 | RN-21: no se convoca a jugadores sin apto vigente (no apto o vencido) | Aprobada |
| 64 | RN-22: máximo 14 convocados, también si se agregan en tandas | Aprobada |
| 65 | RN-23: un jugador no puede estar en dos partidos de la misma fecha, pero sí en fechas distintas | Aprobada |
| 66 | RN-24: no se modifica la convocatoria de un partido que ya se jugó | Aprobada |
| 67 | RN-25: es todo o nada: si uno falla no se guarda ninguno y se informa el motivo | Aprobada |
| 68 | RN-25: convocar de nuevo a un jugador ya convocado se ignora sin error | Aprobada |
| 69 | se puede quitar a un convocado; quitar a quien no está convocado da 404 | Aprobada |
| 70 | elegibles informa quién puede ser convocado y el motivo de quien no | Aprobada |
| 71 | la convocatoria valida el pedido y el partido inexistente da 404 | Aprobada |
| 72 | RN-26: el resumen devuelve las 7 divisiones, también las vacías | Aprobada |
| 73 | RN-26: cuenta activos, aptos, vencidos, no aptos y suspendidos, y no cuenta a los dados de baja | Aprobada |
| 74 | RN-26: los 3 máximos goleadores salen ordenados y solo con goles mayores a 0 | Aprobada |
| 75 | RN-01: el resumen exige sesión | Aprobada |

## Alcance y limitaciones de estas pruebas

- Las pruebas de base de datos usan `pg-mem`, un simulador de PostgreSQL. Cubre las consultas del proyecto, pero **no reemplaza una prueba contra PostgreSQL real**: por eso al desplegar se hace la lista de verificación de abajo.
- Las pruebas de interfaz usan jsdom, no un navegador real. No miden el aspecto visual ni el diseño responsive.
- No hay pruebas automáticas de carga ni de penetración. La seguridad se cubre con las reglas RN-01 a RN-05 y RN-28 (acceso, hash de contraseñas, sesión y secretos) y con consultas SQL siempre parametrizadas.

## Verificación manual en producción (se completa después de publicar)

Marcar cada punto al probar el sitio publicado, con la fecha y quién lo hizo.

- [ ] `GET /api/health` del backend publicado responde `{"estado":"ok"}`.
- [ ] El frontend publicado carga y muestra la pantalla de ingreso.
- [ ] Se puede ingresar con el usuario administrador y con el técnico y el médico.
- [ ] Con el técnico: se crea un jugador, se le suma un gol y se da de baja.
- [ ] Con el médico: se carga el apto físico de un jugador y no aparecen los botones de gestión.
- [ ] Se crea un partido y se convoca a un jugador con apto vigente; no se puede convocar a uno sin apto.
- [ ] El resumen muestra las 7 divisiones.
- [ ] Al cerrar sesión no se puede volver a ver datos sin ingresar.
- [ ] Los datos siguen ahí después de reiniciar el servicio del backend (persistencia en la base).

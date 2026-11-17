# Manual de usuario — Futsal Club

Este manual explica cómo usar la aplicación. No hace falta saber de programación.

## 1. Ingresar

1. Abrí el link de la aplicación en tu navegador (computadora o celular).
2. Escribí tu **email** y tu **contraseña** y tocá **Ingresar**.
3. Arriba a la derecha ves tu nombre y tu rol. Para salir, tocá **Salir**.

Si el sistema estuvo sin usarse, el primer ingreso puede tardar hasta un minuto. Es normal: esperá y no vuelvas a tocar el botón.

Si ves «Credenciales inválidas», revisá el email y la contraseña. Por seguridad el mensaje es el mismo en los dos casos. Si ves «Tu sesión venció», volvé a ingresar: la sesión dura 8 horas.

## 2. Qué puede hacer cada rol

| Acción | Administrador | Técnico | Médico |
|---|:-:|:-:|:-:|
| Ver jugadores, partidos y resumen | sí | sí | sí |
| Crear, editar y dar de baja jugadores | sí | sí | no |
| Sumar estadísticas y rehabilitar | sí | sí | no |
| Cargar el apto físico | sí | no | sí |
| Crear partidos y convocar | sí | sí | no |

Los botones que no corresponden a tu rol no aparecen.

## 3. Plantel

La pestaña **Plantel** muestra los jugadores de una división.

1. Elegí la **división** con los botones de arriba (Octava a Primera).
2. Para **buscar**, escribí parte del nombre o del apellido.
3. Para ver solo los jugadores con un apto determinado, usá el filtro **Todos los aptos** (Apto, Vencido o No apto).

**Cómo leer la tabla**

| Columna | Qué significa |
|---|---|
| Edad | Se calcula sola con la fecha de nacimiento |
| Apto físico | Verde «Apto»: cargado este año. Amarillo «Vencido»: cargado en un año anterior. Rojo «No apto»: sin apto |
| Goles, Amar., Rojas, Asist. | Estadísticas acumuladas |
| Estado | «Suspendido» (en rojo) o «Habilitado» |

### Crear un jugador (administrador y técnico)

1. Tocá **Nuevo jugador**.
2. Completá nombre, apellido, división, fecha de nacimiento, altura (en metros, por ejemplo 1.75) y peso (en kilos).
3. Tocá **Guardar**.

El jugador nuevo aparece como **No apto** y con las estadísticas en cero: el apto lo carga el médico. No se puede crear a dos jugadores con el mismo nombre, apellido y fecha de nacimiento.

### Editar o dar de baja (administrador y técnico)

- **Editar** permite corregir los datos personales.
- **Baja** hace que el jugador deje de aparecer en las listas y no se pueda convocar. Sus datos no se borran. Antes de confirmar, la aplicación te pregunta.

### Cargar el apto físico (médico y administrador)

1. En la fila del jugador tocá **Apto físico**.
2. Elegí «Tiene apto físico» e indicá la **fecha en que se emitió**, o «No tiene apto físico».
3. Tocá **Guardar**.

La fecha no puede ser futura. Un apto emitido en un año anterior figura como **Vencido**.

### Sumar estadísticas (administrador y técnico)

1. Tocá **Estadísticas** en la fila del jugador.
2. Escribí cuánto se **suma** en cada campo. Lo que cargues se agrega a lo que ya tenía; no se puede restar ni cambiar el total.
3. Tocá **Sumar**.

**Suspensiones.** Una **tarjeta roja** o llegar a **5 amarillas** suspende al jugador automáticamente. Un jugador suspendido no se puede convocar. Cuando cumple la suspensión, tocá **Rehabilitar**: las amarillas vuelven a cero (las rojas se conservan).

## 4. Partidos y convocatorias

La pestaña **Partidos** lista los partidos. Cada tarjeta indica división, rival, fecha, lugar y cuántos convocados hay (máximo 14).

### Crear un partido (administrador y técnico)

1. Tocá **Nuevo partido**.
2. Elegí la división, la fecha (hoy o posterior), el rival y el lugar.
3. Tocá **Crear partido**.

### Convocar jugadores (administrador y técnico)

1. En la tarjeta del partido tocá **Convocatoria**.
2. Arriba ves los **convocados**. Con **Quitar** podés sacar a alguno.
3. Abajo ves los **jugadores que se pueden convocar**. Marcá los que quieras y tocá **Convocar seleccionados**.
4. Más abajo, en **No disponibles**, ves quiénes no se pueden convocar y por qué.

**Cuándo un jugador no se puede convocar**

- Es de otra división o fue dado de baja.
- Está suspendido.
- No tiene el apto físico vigente (no tiene o está vencido).
- Ya está convocado a otro partido el mismo día.
- El partido ya tiene 14 convocados.

Si al convocar a varios jugadores uno no cumple, **no se guarda ninguno** y el sistema te dice cuál falló y por qué: corregí y probá de nuevo. La convocatoria de un partido que ya se jugó no se puede modificar.

## 5. Resumen

La pestaña **Resumen** muestra una tarjeta por división con: cantidad de jugadores, cuántos tienen el apto vigente, vencido o no lo tienen, cuántos están suspendidos y los tres máximos goleadores.

## 6. Preguntas frecuentes

**No encuentro un jugador.** Revisá la división elegida y que el buscador y el filtro estén vacíos. Si lo dieron de baja, ya no aparece.

**No puedo crear un jugador: dice que ya existe.** Hay otro con el mismo nombre, apellido y fecha de nacimiento, incluso si está dado de baja.

**Un jugador tiene el apto cargado pero figura «Vencido».** El apto es anual: se considera vigente solo durante el año en que se emitió. Hay que cargar el nuevo.

**No me aparece un botón.** Tu rol no tiene permiso para esa acción.

**Dice «No se pudo conectar con el servidor».** Esperá unos segundos y volvé a intentar; el servidor puede estar despertando. Si sigue, avisá al administrador del sistema.

# Relevamiento del proyecto — Futsal Club

**Proyecto final de Generación T** · Alumno: Valentino Tropea Varotrelli · ETN N°35

## 1. Introducción

Un club de futsal tiene jugadores en siete divisiones (octava, séptima, sexta, quinta, cuarta, tercera y primera). El cuerpo técnico, el cuerpo médico y los dirigentes necesitan saber quién está en cada plantel, quién tiene el apto físico al día, qué rendimiento tuvo cada jugador y a quién se puede convocar a un partido.

Este relevamiento describe el problema, los requerimientos, las decisiones de diseño y el alcance del sistema **Futsal Club**.

**Origen del relevamiento.** Parte del diseño de la aplicación del TP n°1 («Sistema de Gestión de Planteles de Futsal»), donde se definieron el problema, los usuarios, los datos de cada jugador y las funcionalidades. Ese diseño se amplió en la Actividad 4 (diseño del backend) y en este proyecto final. No incluye entrevistas a un club real: las reglas de negocio son decisiones de diseño del proyecto, escritas en [`SPEC.md`](SPEC.md), y pueden ajustarse a las reglas de cada club o liga.

## 2. Problema y objetivos

**Problema.** La información de los jugadores suele estar en planillas dispersas o en papel. Eso dificulta controlar que ningún jugador participe sin el apto físico anual, seguir las estadísticas y las tarjetas, y armar las listas de convocados cumpliendo los límites de cada partido.

**Objetivo general.** Centralizar en una aplicación web, accesible desde internet, la gestión de los planteles de un club de futsal.

**Objetivos específicos.**

1. Registrar a los jugadores de las 7 divisiones con sus datos personales y físicos.
2. Controlar el apto físico anual y mostrar claramente quién lo tiene vigente, vencido o no lo tiene.
3. Llevar las estadísticas (goles, amarillas, rojas y asistencias) y suspender automáticamente según las tarjetas.
4. Armar las convocatorias a partidos aplicando las reglas del club.
5. Dar a cada rol solo las acciones que le corresponden.
6. Ofrecer un resumen por división para la toma de decisiones.

## 3. Alcance

**Incluido**

- Ingreso con usuario y contraseña, con tres roles.
- Alta, edición y baja (lógica) de jugadores.
- Carga del apto físico, estadísticas y rehabilitación de suspendidos.
- Creación de partidos y convocatorias.
- Resumen por división.
- Base de datos y aplicación publicadas en internet.

**No incluido (por ahora)**

- Administración de usuarios desde la pantalla (los usuarios se crean con un script).
- Recuperación de contraseña y cambio de contraseña.
- Carga del resultado y de las estadísticas por partido (las estadísticas se acumulan por jugador).
- Fixture, tabla de posiciones y manejo de torneos.
- Validación de la división según la edad del jugador (cada liga tiene sus propias categorías).
- Aplicación móvil nativa (el frontend es responsive).
- Reactivación de un jugador dado de baja (hoy los datos se conservan en la base, pero no hay pantalla para reactivarlo).

## 4. Usuarios y roles

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| Administrador | Dirigente o responsable del sistema | Todo |
| Técnico | Director técnico, ayudantes | Gestionar jugadores y estadísticas, rehabilitar, crear partidos y convocar |
| Médico | Cuerpo médico, preparador físico | Ver todo y cargar el apto físico |

Los tres roles pueden ver jugadores, partidos y el resumen.

## 5. Requerimientos

### 5.1 Funcionales

| Código | Requerimiento |
|---|---|
| RF-01 | Iniciar y cerrar sesión |
| RF-02 | Listar jugadores por división, con búsqueda por nombre y filtro por estado del apto |
| RF-03 | Crear, editar y dar de baja jugadores |
| RF-04 | Cargar y quitar el apto físico, indicando la fecha de emisión |
| RF-05 | Sumar goles, amarillas, rojas y asistencias |
| RF-06 | Suspender automáticamente y rehabilitar jugadores |
| RF-07 | Crear partidos y consultarlos por división |
| RF-08 | Convocar y quitar jugadores de un partido, informando quiénes no son elegibles y por qué |
| RF-09 | Ver el resumen por división |

### 5.2 No funcionales

| Código | Requerimiento |
|---|---|
| RNF-01 | **Disponibilidad:** accesible desde internet sin instalar nada |
| RNF-02 | **Seguridad:** contraseñas con hash, sesiones firmadas con vencimiento, consultas parametrizadas, secretos fuera del repositorio |
| RNF-03 | **Usabilidad:** interfaz clara y responsive, que se pueda usar desde un celular en un entrenamiento |
| RNF-04 | **Mantenibilidad:** arquitectura en capas y reglas documentadas y numeradas |
| RNF-05 | **Calidad:** pruebas automáticas para cada regla de negocio |
| RNF-06 | **Persistencia:** los datos se guardan en una base de datos PostgreSQL |

## 6. Reglas de negocio

Las 28 reglas (RN-01 a RN-28) están en [`SPEC.md`](SPEC.md) y cada una tiene al menos una prueba automática (ver [`INFORME_PRUEBAS.md`](INFORME_PRUEBAS.md)). Resumen por tema:

| Tema | Reglas | Ejemplo |
|---|---|---|
| Acceso y seguridad | RN-01 a RN-05 | Sin sesión no se accede; la sesión dura 8 horas |
| Jugadores | RN-06 a RN-10 | La edad la calcula el servidor; no hay duplicados; la baja es lógica |
| Apto físico | RN-11 a RN-13 | Un apto de un año anterior figura como vencido |
| Estadísticas y suspensión | RN-14 a RN-17 | Una roja o 5 amarillas suspenden |
| Partidos y convocatorias | RN-18 a RN-25 | Máximo 14 convocados; solo aptos y no suspendidos |
| Panel y errores | RN-26 a RN-28 | Formato único de errores; secretos solo en variables de entorno |

## 7. Modelo de datos

```
usuarios                 jugadores                       partidos            convocatorias
--------                 ---------                       --------            -------------
id (PK)                  id (PK)                         id (PK)             partido_id (PK, FK -> partidos)
nombre                   nombre, apellido                division           jugador_id (PK, FK -> jugadores)
email (único)            division
password_hash            fecha_nacimiento                rival
rol (admin/tecnico/      altura, peso                    lugar
     medico)             apto_fisico, fecha_apto         fecha
                         goles, amarillas, rojas,
                         asistencias
                         suspendido, activo
                         único: (nombre, apellido, fecha_nacimiento)
```

**Relaciones.** Un partido tiene muchos jugadores convocados y un jugador puede estar convocado a muchos partidos: es una relación N:M que se resuelve con la tabla `convocatorias`, cuya clave primaria compuesta (`partido_id`, `jugador_id`) impide convocar dos veces al mismo jugador.

**Datos que se calculan y no se guardan:** la edad y el estado del apto (`apto`, `vencido`, `no_apto`). Así nunca quedan desactualizados con el paso del tiempo.

El esquema completo está en `backend/db/schema.sql`.

## 8. Arquitectura

```
 Navegador (frontend)                    Servidor (backend)                         Base de datos
 --------------------                    ------------------                         -------------
 HTML + CSS + JavaScript   --HTTPS-->    Routes -> Controller -> Service -> Repository  --SQL-->  PostgreSQL
 (Netlify)                    JSON       (Render)                                                  (Neon)
```

| Capa | Responsabilidad |
|---|---|
| Frontend | Mostrar datos y recibir acciones del usuario. No tiene reglas de negocio |
| Routes | Asocia cada URL con su Controller y define los roles que pueden usarla |
| Controller | Traduce entre HTTP y el Service |
| Service | Reglas de negocio y validaciones. No conoce HTTP ni SQL |
| Repository | Único lugar con SQL; siempre con parámetros |

**Por qué esta separación.** Cada capa tiene una sola responsabilidad. Las reglas del Service se prueban sin servidor, y si se cambia de base de datos solo se reescriben los Repository.

## 9. Interfaz: pantallas

| Pantalla | Qué permite |
|---|---|
| Ingreso | Entrar con email y contraseña |
| Plantel | Elegir división, buscar, filtrar por apto; crear, editar, sumar estadísticas, cargar apto, rehabilitar y dar de baja (según el rol) |
| Partidos | Ver los partidos por división, crearlos y abrir su convocatoria |
| Convocatoria | Ver convocados, quitarlos, convocar a los elegibles y ver por qué algunos no lo son |
| Resumen | Una tarjeta por división con totales, estado de aptos, suspendidos y goleadores |

## 10. Seguridad

- Las contraseñas se guardan con **bcrypt**. Ante un email inexistente o una contraseña incorrecta, la respuesta es idéntica.
- La sesión es un **token JWT firmado** que vence a las 8 horas.
- Toda consulta SQL lleva **parámetros**: el texto del usuario nunca se pega dentro del SQL.
- El frontend escapa el texto antes de mostrarlo, para evitar inyección de HTML.
- Los permisos se verifican **en el backend**, no solo ocultando botones.
- Los secretos solo existen como variables de entorno; `.env` está ignorado por git.

## 11. Tecnologías y justificación

| Tecnología | Por qué |
|---|---|
| Node.js y Express | Mismo lenguaje (JavaScript) en frontend y backend; es lo trabajado en el curso |
| PostgreSQL (Neon) | Base relacional adecuada a datos con relaciones y restricciones; Neon tiene plan gratuito |
| Render | Publica el backend directamente desde GitHub |
| Netlify | Publica el frontend estático |
| Bootstrap | Diseño responsive sin escribir todo el CSS |
| JWT y bcrypt | Estándares para sesiones y contraseñas |

## 12. Pruebas

75 pruebas automáticas cubren las 28 reglas de negocio, la API con los tres roles y el uso de la interfaz. Los resultados están en [`INFORME_PRUEBAS.md`](INFORME_PRUEBAS.md), junto con las limitaciones y la lista de verificación manual en producción.

## 13. Riesgos y limitaciones

| Riesgo | Mitigación |
|---|---|
| El plan gratuito de Render se «duerme» y la primera respuesta tarda | Abrir `/api/health` antes de usar; está indicado en el README |
| Los planes gratuitos tienen límites de uso | Suficiente para una demostración; para un club real conviene un plan pago |
| No hay límite de intentos de ingreso | Mejora futura: limitar intentos por IP |
| Los usuarios se crean con un script | Mejora futura: pantalla de administración de usuarios |
| Las reglas (14 convocados, 5 amarillas) son decisiones del proyecto | Están aisladas y documentadas; se ajustan según cada liga |

## 14. Cómo evolucionó el proyecto

1. **TP n°1:** diseño de la aplicación (problema, funcionalidades, datos).
2. **TP n°3:** práctica de modelado de datos con relaciones 1:N y N:M.
3. **Actividad 4:** diseño del backend en capas y primera funcionalidad implementada, con persistencia en archivo JSON.
4. **Proyecto final:** persistencia en PostgreSQL, ingreso con roles, estadísticas, suspensiones, convocatorias, frontend completo, pruebas, documentación y publicación.

## 15. Trabajo futuro

- Administración de usuarios y cambio de contraseña.
- Resultado y estadísticas por partido.
- Fixture y tabla de posiciones.
- Validación de la división según la edad, con las categorías de cada liga.
- Reactivación de jugadores dados de baja.
- Límite de intentos de ingreso y registro de auditoría.

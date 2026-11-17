// Corre toda la batería de tests y genera docs/INFORME_PRUEBAS.md con los resultados reales.
// Uso: npm run informe   (falla si algún test falla o si alguna regla RN-xx no tiene tests)
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const salida = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd: raiz, encoding: 'utf-8' });
const lineas = salida.stdout.split('\n');

const pruebas = lineas
  .map((l) => l.match(/^(not ok|ok) \d+ - (.+)$/))
  .filter((m) => m && !m[2].startsWith('/') && !m[2].endsWith('.js'))
  .map((m) => ({ ok: m[1] === 'ok', nombre: m[2] }));
const dato = (clave) => (lineas.find((l) => l.startsWith(`# ${clave} `)) || '').split(' ').pop();
const duracion = (Number(dato('duration_ms')) / 1000).toFixed(1);

const spec = fs.readFileSync(path.join(raiz, '../docs/SPEC.md'), 'utf-8');
const reglas = [...spec.matchAll(/^- \*\*(RN-\d+)\*\* (.+)$/gm)].map((m) => ({ codigo: m[1], texto: m[2].replace(/\*\*/g, '') }));
const cobertura = reglas.map((r) => ({ ...r, pruebas: pruebas.filter((p) => new RegExp(`${r.codigo}(?!\\d)`).test(p.nombre)) }));
const sinPruebas = cobertura.filter((r) => !r.pruebas.length);
const fallaron = pruebas.filter((p) => !p.ok);
const corto = (t) => (t.length > 110 ? `${t.slice(0, 107)}…` : t);
const celda = (t) => t.replace(/\|/g, '\\|');

const md = `# Informe de pruebas

Generado automáticamente por \`npm run informe\` el **${new Date().toISOString().slice(0, 10)}** con Node ${process.version}.

## Resumen

| Dato | Resultado |
|---|---|
| Pruebas ejecutadas | ${pruebas.length} |
| Aprobadas | ${pruebas.length - fallaron.length} |
| Fallidas | ${fallaron.length} |
| Duración | ${duracion} s |
| Reglas de negocio en la spec | ${reglas.length} |
| Reglas con al menos una prueba | ${reglas.length - sinPruebas.length} de ${reglas.length} |

**Veredicto: ${fallaron.length === 0 && sinPruebas.length === 0 ? 'todas las pruebas pasan y todas las reglas de la especificación están cubiertas.' : 'HAY PROBLEMAS, revisar las secciones siguientes.'}**

## Cómo se ejecutaron

- Comando: \`cd backend && npm test\` (usa el ejecutor de pruebas integrado de Node, \`node --test\`).
- **Base de datos:** PostgreSQL simulado en memoria con \`pg-mem\`, con el mismo esquema (\`backend/db/schema.sql\`) que producción. Cada archivo de pruebas arranca su propia base vacía.
- **API:** se levanta el servidor Express real en un puerto libre y se lo llama por HTTP con \`fetch\`, con un usuario de cada rol (admin, técnico y médico).
- **Fecha:** las pruebas fijan «hoy» en 2026-11-16 para que los resultados no dependan del día en que se ejecutan.
- **Frontend:** \`backend/test/frontend.test.js\` carga la página real (\`frontend/index.html\` con sus scripts) en un navegador simulado (jsdom) y usa la interfaz contra la API: ingresar, crear jugadores, cargar apto, convocar, ver el resumen y salir.

## Cobertura de reglas de negocio

| Regla | Descripción | Pruebas | Resultado |
|---|---|:-:|:-:|
${cobertura.map((r) => `| ${r.codigo} | ${celda(corto(r.texto))} | ${r.pruebas.length} | ${r.pruebas.length && r.pruebas.every((p) => p.ok) ? 'Aprobada' : r.pruebas.length ? 'FALLA' : 'SIN PRUEBA'} |`).join('\n')}

## Detalle de todas las pruebas

| N° | Prueba | Resultado |
|--:|---|:-:|
${pruebas.map((p, i) => `| ${i + 1} | ${celda(p.nombre)} | ${p.ok ? 'Aprobada' : 'FALLA'} |`).join('\n')}

## Alcance y limitaciones de estas pruebas

- Las pruebas de base de datos usan \`pg-mem\`, un simulador de PostgreSQL. Cubre las consultas del proyecto, pero **no reemplaza una prueba contra PostgreSQL real**: por eso al desplegar se hace la lista de verificación de abajo.
- Las pruebas de interfaz usan jsdom, no un navegador real. No miden el aspecto visual ni el diseño responsive.
- No hay pruebas automáticas de carga ni de penetración. La seguridad se cubre con las reglas RN-01 a RN-05 y RN-28 (acceso, hash de contraseñas, sesión y secretos) y con consultas SQL siempre parametrizadas.

## Verificación manual en producción (se completa después de publicar)

Marcar cada punto al probar el sitio publicado, con la fecha y quién lo hizo.

- [ ] \`GET /api/health\` del backend publicado responde \`{"estado":"ok"}\`.
- [ ] El frontend publicado carga y muestra la pantalla de ingreso.
- [ ] Se puede ingresar con el usuario administrador y con el técnico y el médico.
- [ ] Con el técnico: se crea un jugador, se le suma un gol y se da de baja.
- [ ] Con el médico: se carga el apto físico de un jugador y no aparecen los botones de gestión.
- [ ] Se crea un partido y se convoca a un jugador con apto vigente; no se puede convocar a uno sin apto.
- [ ] El resumen muestra las 7 divisiones.
- [ ] Al cerrar sesión no se puede volver a ver datos sin ingresar.
- [ ] Los datos siguen ahí después de reiniciar el servicio del backend (persistencia en la base).
`;

fs.writeFileSync(path.join(raiz, '../docs/INFORME_PRUEBAS.md'), md);
console.log(`Informe generado: ${pruebas.length} pruebas, ${fallaron.length} fallidas, ${sinPruebas.length} reglas sin pruebas.`);
if (fallaron.length || sinPruebas.length) process.exit(1);

// Crea los usuarios iniciales. Con DEMO=true agrega jugadores y un partido de ejemplo.
// Las contraseñas salen de las variables SEED_*_PASSWORD; si faltan, se generan al azar y se muestran una sola vez.
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
try { process.loadEnvFile(); } catch { /* sin archivo .env: se usan las variables del sistema */ }
const { crearPool } = require('../src/db');

const USUARIOS = [
  { nombre: 'Administrador', email: 'admin@futsalclub.com', rol: 'admin', variable: 'SEED_ADMIN_PASSWORD' },
  { nombre: 'Director Técnico', email: 'tecnico@futsalclub.com', rol: 'tecnico', variable: 'SEED_TECNICO_PASSWORD' },
  { nombre: 'Cuerpo Médico', email: 'medico@futsalclub.com', rol: 'medico', variable: 'SEED_MEDICO_PASSWORD' },
];

const anio = new Date().getFullYear();
const JUGADORES_DEMO = [
  ['Lucas', 'Pérez', 'septima', '2012-05-14', 1.60, 52.5, true, 5, 0, 0, 2],
  ['Tomás', 'Gómez', 'septima', '2012-09-02', 1.58, 50.0, false, 2, 1, 0, 1],
  ['Mateo', 'Suárez', 'quinta', '2009-08-21', 1.72, 64.5, true, 7, 3, 0, 3],
  ['Bruno', 'Ríos', 'quinta', '2009-01-30', 1.75, 68.0, true, 1, 4, 1, 0],
  ['Franco', 'Díaz', 'cuarta', '2008-03-11', 1.78, 70.2, false, 0, 0, 0, 0],
  ['Juan', 'Medina', 'primera', '2001-11-20', 1.80, 75.0, true, 12, 2, 0, 6],
  ['Santiago', 'Ledesma', 'primera', '1999-06-05', 1.83, 78.4, true, 9, 5, 0, 4],
  ['Nicolás', 'Acosta', 'primera', '2000-12-17', 1.76, 72.1, true, 4, 1, 0, 8],
];

(async () => {
  const pool = crearPool(process.env.DATABASE_URL);
  try {
    for (const u of USUARIOS) {
      const clave = process.env[u.variable] || crypto.randomBytes(9).toString('base64url');
      const generada = !process.env[u.variable];
      const hash = await bcrypt.hash(clave, 10);
      const r = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
        [u.nombre, u.email, hash, u.rol]
      );
      if (r.rowCount === 0) console.log(`${u.email}: ya existía, no se cambió`);
      else console.log(`${u.email} (${u.rol})${generada ? ` contraseña generada: ${clave}` : ' contraseña tomada de ' + u.variable}`);
    }
    if (process.env.DEMO === 'true') {
      for (const [n, a, d, nac, alt, peso, apto, g, am, ro, as] of JUGADORES_DEMO) {
        await pool.query(
          `INSERT INTO jugadores (nombre, apellido, division, fecha_nacimiento, altura, peso, apto_fisico, fecha_apto, goles, amarillas, rojas, asistencias, suspendido)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (nombre, apellido, fecha_nacimiento) DO NOTHING`,
          [n, a, d, nac, alt, peso, apto, apto ? `${anio}-03-10` : null, g, am, ro, as, ro > 0 || am >= 5]
        );
      }
      console.log('Datos de ejemplo cargados.');
    }
  } finally {
    await pool.end();
  }
})().catch((e) => { console.error('No se pudo cargar los datos iniciales:', e.message); process.exit(1); });

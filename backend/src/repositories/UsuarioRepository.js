// REPOSITORY de usuarios: único lugar con SQL de la tabla usuarios.
class UsuarioRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async buscarPorEmail(email) {
    const r = await this.pool.query(
      'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return r.rows[0] || null;
  }

  async crear({ nombre, email, passwordHash, rol }) {
    const r = await this.pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, passwordHash, rol]
    );
    return r.rows[0];
  }
}
module.exports = UsuarioRepository;

-- Esquema de la base de datos (PostgreSQL). Se puede ejecutar más de una vez sin romper nada.

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'tecnico', 'medico'))
);

CREATE TABLE IF NOT EXISTS jugadores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  division TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  altura NUMERIC(3,2) NOT NULL,
  peso NUMERIC(5,2) NOT NULL,
  apto_fisico BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_apto DATE,
  goles INTEGER NOT NULL DEFAULT 0,
  amarillas INTEGER NOT NULL DEFAULT 0,
  rojas INTEGER NOT NULL DEFAULT 0,
  asistencias INTEGER NOT NULL DEFAULT 0,
  suspendido BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (nombre, apellido, fecha_nacimiento)
);

CREATE TABLE IF NOT EXISTS partidos (
  id SERIAL PRIMARY KEY,
  division TEXT NOT NULL,
  rival TEXT NOT NULL,
  lugar TEXT NOT NULL,
  fecha DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS convocatorias (
  partido_id INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id INTEGER NOT NULL REFERENCES jugadores(id),
  PRIMARY KEY (partido_id, jugador_id)
);

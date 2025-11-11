
-- PostgreSQL schema
CREATE TABLE IF NOT EXISTS area (
  id_area INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_area VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cargo (
  id_cargo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_cargo VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuario_sistema (
  id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  nombre_completo VARCHAR(150) NOT NULL,
  rol VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS politica_vacaciones (
  id_politica INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre_politica VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  vigente BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS politica_detalle_antiguedad (
  id_politica_detalle INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_politica INTEGER NOT NULL REFERENCES politica_vacaciones(id_politica),
  anios_desde INT NOT NULL,
  anios_hasta INT,
  dias_anuales INT NOT NULL,
  CONSTRAINT ck_rango_antiguedad CHECK (anios_desde >= 0)
);

CREATE TABLE IF NOT EXISTS trabajador (
  id_trabajador INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo_interno VARCHAR(20) NOT NULL UNIQUE,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre_completo VARCHAR(150) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  id_area INT NOT NULL REFERENCES area(id_area),
  id_cargo INT NOT NULL REFERENCES cargo(id_cargo),
  estado CHAR(1) DEFAULT 'A',
  id_politica INT REFERENCES politica_vacaciones(id_politica)
);

CREATE TABLE IF NOT EXISTS saldo_vacaciones (
  id_saldo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_trabajador INT NOT NULL REFERENCES trabajador(id_trabajador),
  anio INT NOT NULL,
  dias_asignados INT NOT NULL DEFAULT 0,
  dias_tomados INT NOT NULL DEFAULT 0,
  CONSTRAINT uq_saldo_trabajador_anio UNIQUE (id_trabajador, anio)
);

CREATE TABLE IF NOT EXISTS solicitud_vacaciones (
  id_solicitud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_trabajador INT NOT NULL REFERENCES trabajador(id_trabajador),
  fecha_solicitud TIMESTAMP NOT NULL,
  tipo_solicitud CHAR(1) NOT NULL, -- 'D' o 'H'
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  cantidad_dias NUMERIC(5,2),
  cantidad_horas NUMERIC(5,2),
  estado VARCHAR(10) NOT NULL DEFAULT 'pendiente',
  id_usuario_revisor INT REFERENCES usuario_sistema(id_usuario),
  fecha_revision TIMESTAMP,
  observaciones TEXT,
  CONSTRAINT ck_tipo_cantidad CHECK (
    (tipo_solicitud = 'D' AND cantidad_dias IS NOT NULL AND cantidad_horas IS NULL) OR
    (tipo_solicitud = 'H' AND cantidad_horas IS NOT NULL AND cantidad_dias IS NULL)
  )
);

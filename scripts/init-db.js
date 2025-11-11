
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db from '../src/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaPath = path.join(__dirname, '..', 'schema.sql')
const sql = fs.readFileSync(schemaPath, 'utf-8')

await db.query(sql)  // Ejecuta todo el schema

// Seeds con ON CONFLICT
await db.query(`INSERT INTO area (nombre_area) VALUES ('Tecnología') ON CONFLICT (nombre_area) DO NOTHING;`)
await db.query(`INSERT INTO area (nombre_area) VALUES ('RRHH') ON CONFLICT (nombre_area) DO NOTHING;`)
await db.query(`INSERT INTO cargo (nombre_cargo) VALUES ('Desarrollador') ON CONFLICT (nombre_cargo) DO NOTHING;`)
await db.query(`INSERT INTO cargo (nombre_cargo) VALUES ('Analista') ON CONFLICT (nombre_cargo) DO NOTHING;`)
await db.query(`
  INSERT INTO usuario_sistema (nombre_usuario, nombre_completo, rol)
  VALUES ('admin', 'Admin RRHH', 'admin')
  ON CONFLICT (nombre_usuario) DO NOTHING;
`)

// Inserta trabajador de ejemplo con subconsultas para área y cargo
await db.query(`
  INSERT INTO trabajador (codigo_interno, cedula, nombre_completo, fecha_ingreso, id_area, id_cargo, estado)
  VALUES (
    'EMP-001', '1234567', 'María Pérez', '2020-03-15',
    (SELECT id_area FROM area WHERE nombre_area='Tecnología'),
    (SELECT id_cargo FROM cargo WHERE nombre_cargo='Desarrollador'),
    'A'
  )
  ON CONFLICT (codigo_interno) DO NOTHING;
`)

// Crea saldo del año actual si no existe
await db.query(`
  INSERT INTO saldo_vacaciones (id_trabajador, anio, dias_asignados, dias_tomados)
  SELECT id_trabajador, EXTRACT(YEAR FROM CURRENT_DATE)::int, 15, 0
  FROM trabajador
  WHERE codigo_interno = 'EMP-001'
  ON CONFLICT (id_trabajador, anio) DO NOTHING;
`)

console.log('Base de datos PostgreSQL inicializada.')

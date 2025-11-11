
import db from '../db.js'
import dayjs from 'dayjs'

export async function listarSolicitudes (req, res, next) {
  try {
    const { trabajador_id } = req.query
    let result
    if (trabajador_id) {
      result = await db.query(`
        SELECT s.*, t.nombre_completo
        FROM solicitud_vacaciones s
        JOIN trabajador t ON t.id_trabajador = s.id_trabajador
        WHERE s.id_trabajador = $1
        ORDER BY s.id_solicitud DESC
      `, [trabajador_id])
    } else {
      result = await db.query(`
        SELECT s.*, t.nombre_completo
        FROM solicitud_vacaciones s
        JOIN trabajador t ON t.id_trabajador = s.id_trabajador
        ORDER BY s.id_solicitud DESC
      `)
    }
    res.json(result.rows)
  } catch (e) { next(e) }
}

export async function crearSolicitud (req, res, next) {
  try {
    const {
      id_trabajador, tipo_solicitud, fecha_inicio, fecha_fin,
      cantidad_dias, cantidad_horas, observaciones
    } = req.body

    if (dayjs(fecha_fin).isBefore(dayjs(fecha_inicio))) {
      return res.status(400).json({ message: 'fecha_fin no puede ser anterior a fecha_inicio' })
    }

    const t = await db.query('SELECT 1 FROM trabajador WHERE id_trabajador = $1', [id_trabajador])
    if (t.rowCount === 0) return res.status(404).json({ message: 'Trabajador no encontrado' })

    const now = dayjs().toISOString()
    const result = await db.query(`
      INSERT INTO solicitud_vacaciones
        (id_trabajador, fecha_solicitud, tipo_solicitud, fecha_inicio, fecha_fin,
         cantidad_dias, cantidad_horas, estado, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8)
      RETURNING *
    `, [
      id_trabajador, now, tipo_solicitud, fecha_inicio, fecha_fin,
      tipo_solicitud === 'D' ? cantidad_dias : null,
      tipo_solicitud === 'H' ? cantidad_horas : null,
      observaciones || null
    ])

    res.status(201).json(result.rows[0])
  } catch (e) { next(e) }
}

export async function decidirSolicitud (req, res, next) {
  const id = Number(req.params.id)
  const { decision, id_usuario_revisor, observaciones } = req.body

  const client = await db.getClient()
  try {
    await client.query('BEGIN')

    const sol = await client.query('SELECT * FROM solicitud_vacaciones WHERE id_solicitud = $1 FOR UPDATE', [id])
    if (sol.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Solicitud no encontrada' }) }
    const solicitud = sol.rows[0]
    if (solicitud.estado !== 'pendiente') { await client.query('ROLLBACK'); return res.status(400).json({ message: 'La solicitud ya fue decidida' }) }

    const u = await client.query('SELECT 1 FROM usuario_sistema WHERE id_usuario = $1', [id_usuario_revisor])
    if (u.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Usuario revisor no encontrado' }) }

    const nuevoEstado = decision === 'aprobar' ? 'aprobada' : 'rechazada'
    const fechaRevision = dayjs().toISOString()

    await client.query(`
      UPDATE solicitud_vacaciones
      SET estado = $1, id_usuario_revisor = $2, fecha_revision = $3,
          observaciones = COALESCE($4, observaciones)
      WHERE id_solicitud = $5
    `, [nuevoEstado, id_usuario_revisor, fechaRevision, observaciones || null, id])

    if (nuevoEstado === 'aprobada' && solicitud.tipo_solicitud === 'D' && solicitud.cantidad_dias) {
      const anio = dayjs(solicitud.fecha_inicio).year()
      const saldo = await client.query(`
        SELECT * FROM saldo_vacaciones WHERE id_trabajador = $1 AND anio = $2 FOR UPDATE
      `, [solicitud.id_trabajador, anio])

      if (saldo.rowCount === 0) {
        await client.query(`
          INSERT INTO saldo_vacaciones (id_trabajador, anio, dias_asignados, dias_tomados)
          VALUES ($1, $2, 0, 0)
        `, [solicitud.id_trabajador, anio])
      }

      await client.query(`
        UPDATE saldo_vacaciones
        SET dias_tomados = dias_tomados + $1
        WHERE id_trabajador = $2 AND anio = $3
      `, [solicitud.cantidad_dias, solicitud.id_trabajador, anio])
    }

    await client.query('COMMIT')

    const updated = await db.query('SELECT * FROM solicitud_vacaciones WHERE id_solicitud = $1', [id])
    res.json(updated.rows[0])
  } catch (e) {
    await client.query('ROLLBACK')
    next(e)
  } finally {
    client.release()
  }
}

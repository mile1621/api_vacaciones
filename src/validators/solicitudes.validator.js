
import Joi from 'joi'

const crearSchema = Joi.object({
  id_trabajador: Joi.number().integer().required(),
  tipo_solicitud: Joi.string().valid('D', 'H').required(),
  fecha_inicio: Joi.date().iso().required(),
  fecha_fin: Joi.date().iso().required(),
  cantidad_dias: Joi.number().precision(2).when('tipo_solicitud', { is: 'D', then: Joi.required(), otherwise: Joi.forbidden() }),
  cantidad_horas: Joi.number().precision(2).when('tipo_solicitud', { is: 'H', then: Joi.required(), otherwise: Joi.forbidden() }),
  observaciones: Joi.string().allow('', null)
})

const decisionSchema = Joi.object({
  decision: Joi.string().valid('aprobar', 'rechazar').required(),
  id_usuario_revisor: Joi.number().integer().required(),
  observaciones: Joi.string().allow('', null)
})

export function validateCrearSolicitud (req, res, next) {
  const { error, value } = crearSchema.validate(req.body, { abortEarly: false })
  if (error) return res.status(400).json({ message: 'Validación falló', details: error.details })
  req.body = value; next()
}

export function validateDecision (req, res, next) {
  const { error, value } = decisionSchema.validate(req.body, { abortEarly: false })
  if (error) return res.status(400).json({ message: 'Validación falló', details: error.details })
  req.body = value; next()
}

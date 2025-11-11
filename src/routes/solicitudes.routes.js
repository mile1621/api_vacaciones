
import { Router } from 'express'
import * as controller from '../controllers/solicitudes.controller.js'
import { validateCrearSolicitud, validateDecision } from '../validators/solicitudes.validator.js'

const router = Router()

router.get('/', controller.listarSolicitudes)
router.post('/', validateCrearSolicitud, controller.crearSolicitud)
router.post('/:id/decision', validateDecision, controller.decidirSolicitud)

export default router

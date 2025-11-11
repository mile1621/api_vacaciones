
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import solicitudesRouter from './routes/solicitudes.routes.js'
import { errorHandler, notFound } from './middlewares/error-handler.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => res.json({ ok: true, name: 'API Vacaciones (PostgreSQL)' }))

app.use('/api/solicitudes', solicitudesRouter)

app.use(notFound)
app.use(errorHandler)

export default app

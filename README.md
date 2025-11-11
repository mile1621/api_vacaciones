
# API Vacaciones (PostgreSQL)

## Requisitos
- Node.js 18+
- PostgreSQL 13+

## Configuración
1. Crea una base de datos, por ejemplo `vacaciones`.
2. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`.
3. Instala dependencias e inicializa:
```bash
npm install
npm run init:db
npm run dev
```
El servidor queda en `http://localhost:3000`.

## Endpoints
- **POST /api/solicitudes**: Crea solicitud (por días u horas).
- **POST /api/solicitudes/:id/decision**: Aprueba/Rechaza con revisor.
- **GET /api/solicitudes?trabajador_id=1**: Lista solicitudes.

## Notas
- Estados: `pendiente|aprobada|rechazada`.
- En aprobación por **días** se incrementa `dias_tomados` del saldo del año correspondiente (se crea el saldo si no existe).

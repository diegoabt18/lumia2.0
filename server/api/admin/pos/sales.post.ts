import { proxyToLumiaApi } from '../../../utils/lumia-api-client'

/** POS: registrar una venta (Server: orders.create; exige Idempotency-Key). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

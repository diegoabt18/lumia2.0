import { proxyToLumiaApi } from '../../../../../../utils/lumia-api-client'

/** POS: confirmar el pago de una venta (Server: orders.update). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

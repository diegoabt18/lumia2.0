import { proxyToLumiaApi } from '../../../../utils/lumia-api-client'

/** POS: registrar un abono a un pedido (Server: orders.update). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

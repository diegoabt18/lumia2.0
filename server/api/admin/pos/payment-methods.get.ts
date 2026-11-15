import { proxyToLumiaApi } from '../../../utils/lumia-api-client'

/** POS: métodos de pago disponibles (Server: orders.create). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

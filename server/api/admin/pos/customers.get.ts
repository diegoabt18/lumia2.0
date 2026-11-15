import { proxyToLumiaApi } from '../../../utils/lumia-api-client'

/** POS: búsqueda de clientes (Server: orders.read). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

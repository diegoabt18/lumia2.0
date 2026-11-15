import { proxyToLumiaApi } from '../../../utils/lumia-api-client'

/** POS: búsqueda de productos (Server: products.read). */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

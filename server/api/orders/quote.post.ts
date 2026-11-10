import { proxyToLumiaApi } from '../../utils/lumia-api-client'

/** Cotización financiera del carrito (anticipo y saldo). El cálculo lo hace Server. */
export default defineEventHandler(async (event) => proxyToLumiaApi(event))

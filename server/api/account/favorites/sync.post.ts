import { proxyToLumiaApi } from '../../../utils/lumia-api-client'

export default defineEventHandler(async (event) => proxyToLumiaApi(event))

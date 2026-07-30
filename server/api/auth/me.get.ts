import { mapApiUserToAuthUser, proxyToLumiaApi } from '../../utils/lumia-api-client'

export default defineEventHandler(async (event) => {
  const data = await proxyToLumiaApi(event, '/api/auth/me')
  if (getResponseStatus(event) !== 200) return data
  return mapApiUserToAuthUser(data)
})

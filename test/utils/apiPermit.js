import { apiPaths } from '../config/apiRoutes.js'
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  createAuthorizedHeaders,
  createDefaultHeaders,
  generateApiToken,
  sendApiRequest
} from './apiClient.js'
import { getByPath, getPrimaryResponseObject } from './apiAssertions.js'

export const apiContext = {
  headers: {},
  lastRequestBody: undefined,
  response: undefined
}

export const setDefaultApiHeaders = () => {
  apiContext.headers = createDefaultHeaders()
}

export const setAuthorizedApiHeaders = async () => {
  apiContext.headers = await createAuthorizedHeaders()
}

export const generateApiTokenAndSetHeaders = async () => {
  await generateApiToken({ forceRefresh: true })
  await setAuthorizedApiHeaders()
}

export const setRequiredPermitStatus = (status) => {
  apiContext.requiredPermitStatus = status
}

export const getPermitNumber = () => {
  const responseObject = apiContext.response?.data
    ? getPrimaryResponseObject(apiContext.response.data)
    : {}

  return (
    apiContext.lastRequestBody?.permitNumber ??
    responseObject.permitNumber ??
    getByPath(responseObject, 'permit.permitNumber')
  )
}

export const replacePathParams = (path, values) =>
  Object.entries(values).reduce(
    (currentPath, [key, value]) =>
      currentPath.replaceAll(`:${key}`, encodeURIComponent(value)),
    path
  )

export const sendSearchPermitRequest = async (body) => {
  apiContext.lastRequestBody = body
  apiContext.response = await sendApiRequest({
    method: 'POST',
    path: apiPaths.searchPermit,
    headers: apiContext.headers,
    body: apiContext.lastRequestBody
  })
}

export const sendEndorsePermitRequest = async (body) => {
  apiContext.lastRequestBody = body
  apiContext.response = await sendApiRequest({
    method: 'POST',
    path: apiPaths.endorsePermit,
    headers: apiContext.headers,
    body: apiContext.lastRequestBody
  })
}

export const sendPermitLookupRequest = async (permitNumber) => {
  const hasPathParam = apiPaths.retrievePermit.includes(':permitNumber')
  const path = replacePathParams(apiPaths.retrievePermit, { permitNumber })

  return sendApiRequest({
    method: hasPathParam ? 'GET' : 'POST',
    path,
    headers: apiContext.headers,
    body: hasPathParam ? undefined : { permitNumber }
  })
}

export const sendPermitHistoryRequest = async () => {
  if (!apiPaths.permitHistory) {
    throw new Error(
      'Permit history was not included in the endorsement response. Set PERMIT_HISTORY_API_PATH to verify Pegasus history.'
    )
  }

  const permitNumber = getPermitNumber()

  if (!permitNumber) {
    throw new Error('Could not determine permit number to retrieve history.')
  }

  const path = replacePathParams(apiPaths.permitHistory, { permitNumber })

  return sendApiRequest({
    method: 'GET',
    path,
    headers: apiContext.headers
  })
}

export const getInlinePermitHistory = () => {
  const responseObject = getPrimaryResponseObject(apiContext.response.data)

  return (
    responseObject.history ??
    responseObject.permitHistory ??
    responseObject.events ??
    responseObject.auditHistory
  )
}

export const sendCrudRequest = async ({ method, path, body }) => {
  const requestConfig = {
    path,
    headers: apiContext.headers,
    body
  }

  const requests = {
    DELETE: apiDelete,
    GET: apiGet,
    POST: apiPost,
    PUT: apiPut
  }

  const request = requests[method]

  if (!request) {
    throw new Error(`Unsupported API request method: ${method}`)
  }

  apiContext.lastRequestBody = body
  apiContext.response = await request(requestConfig)
}

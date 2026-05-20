import { apiRouteConfig, resolveApiPath } from '../config/apiRoutes.js'

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'OData-MaxVersion': '4.0',
  'OData-Version': '4.0'
}

const formHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded'
}

const envHeaderMappings = [
  ['API_BEARER_TOKEN', 'Authorization', (value) => `Bearer ${value}`],
  ['API_TOKEN', 'Authorization', (value) => `Bearer ${value}`],
  ['OCP_APIM_SUBSCRIPTION_KEY', 'Ocp-Apim-Subscription-Key'],
  ['API_KEY', 'x-api-key']
]

const getDataverseTokenScope = () => {
  if (!apiRouteConfig.baseUrl) return undefined

  return `${new URL(apiRouteConfig.baseUrl).origin}/.default`
}

const getDataverseTokenResource = () => {
  if (!apiRouteConfig.baseUrl) return undefined

  return `${new URL(apiRouteConfig.baseUrl).origin}/`
}

const tokenVersion =
  process.env.API_TOKEN_VERSION ?? process.env.TOKEN_VERSION ?? '1'

const getTokenUrl = () => {
  if (process.env.API_TOKEN_URL ?? process.env.TOKEN_URL) {
    return process.env.API_TOKEN_URL ?? process.env.TOKEN_URL
  }

  const authority =
    process.env.API_AUTHORITY ?? process.env.API_TENANT_ID ?? 'common'
  const tokenPath = tokenVersion === '1' ? 'token' : 'v2.0/token'

  return `https://login.microsoftonline.com/${authority}/oauth2/${tokenPath}`
}

const tokenConfig = {
  url: getTokenUrl(),
  clientId:
    process.env.API_CLIENT_ID ??
    process.env.CLIENT_ID ??
    apiRouteConfig.clientId,
  clientSecret: process.env.API_CLIENT_SECRET ?? process.env.CLIENT_SECRET,
  scope:
    process.env.API_TOKEN_SCOPE ??
    process.env.TOKEN_SCOPE ??
    (tokenVersion === '1' ? undefined : getDataverseTokenScope()),
  resource:
    process.env.API_TOKEN_RESOURCE ??
    process.env.TOKEN_RESOURCE ??
    (tokenVersion === '1' ? getDataverseTokenResource() : undefined),
  grantType:
    process.env.API_TOKEN_GRANT_TYPE ??
    process.env.TOKEN_GRANT_TYPE ??
    'password',
  username:
    process.env.API_USERNAME ?? process.env.USERNAME ?? process.env.EMAIL,
  password: process.env.API_PASSWORD ?? process.env.PASSWORD
}

let cachedAccessToken

const normaliseBaseUrl = (value) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    throw new Error(
      'API base URL is not configured. Set API_BASE_URL/BACKEND_URL, or configure the environment in test/config/apiRoutes.js.'
    )
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

const parseJsonEnv = (name) => {
  const value = process.env[name]

  if (!value) return {}

  try {
    return JSON.parse(value)
  } catch (error) {
    throw new Error(`${name} must be valid JSON. ${error.message}`, {
      cause: error
    })
  }
}

const getApiBaseUrl = () =>
  normaliseBaseUrl(
    process.env.API_BASE_URL ??
      process.env.BACKEND_URL ??
      process.env.BASE_URL ??
      (apiRouteConfig.baseUrl
        ? `${apiRouteConfig.baseUrl}${apiRouteConfig.apiVersionPath}`
        : undefined)
  )

const getStaticAccessToken = () =>
  process.env.API_BEARER_TOKEN ?? process.env.API_TOKEN

const getAuthHeaders = () => {
  const headers = {}

  for (const [envName, headerName, transform] of envHeaderMappings) {
    const value = process.env[envName]
    if (!value) continue

    headers[headerName] = transform ? transform(value) : value
  }

  return headers
}

const createTokenRequestBody = () => {
  const params = new URLSearchParams()

  params.set('grant_type', tokenConfig.grantType)

  if (tokenConfig.clientId) {
    params.set('client_id', tokenConfig.clientId)
  }

  if (tokenConfig.clientSecret) {
    params.set('client_secret', tokenConfig.clientSecret)
  }

  if (tokenConfig.scope) {
    params.set('scope', tokenConfig.scope)
  }

  if (tokenConfig.resource) {
    params.set('resource', tokenConfig.resource)
  }

  if (tokenConfig.grantType === 'password') {
    if (tokenConfig.username) params.set('username', tokenConfig.username)
    if (tokenConfig.password) params.set('password', tokenConfig.password)
  }

  return params
}

export const generateApiToken = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && cachedAccessToken) {
    return cachedAccessToken
  }

  const staticToken = getStaticAccessToken()

  if (staticToken && (!forceRefresh || !tokenConfig.url)) {
    cachedAccessToken = staticToken
    return cachedAccessToken
  }

  if (!tokenConfig.url) {
    throw new Error(
      'API token URL is not configured. Set API_TOKEN_URL/TOKEN_URL, or provide API_BEARER_TOKEN/API_TOKEN.'
    )
  }

  if (tokenConfig.grantType === 'implicit') {
    throw new Error(
      'API_TOKEN_GRANT_TYPE=implicit requires a token generated in Postman/Insomnia. Paste the access token into API_BEARER_TOKEN in your local .env file before running API tests.'
    )
  }

  const response = await fetch(tokenConfig.url, {
    method: 'POST',
    headers: {
      ...formHeaders,
      ...parseJsonEnv('API_TOKEN_HEADERS')
    },
    body: createTokenRequestBody()
  })
  const text = await response.text()
  let data

  try {
    data = text ? JSON.parse(text) : {}
  } catch (error) {
    throw new Error(`Token response must be valid JSON. ${error.message}`, {
      cause: error
    })
  }

  if (!response.ok) {
    if (response.status === 401 && text.includes('AADSTS7000218')) {
      throw new Error(
        'Token request failed because Azure AD requires this client to send a client_secret or client_assertion. ' +
          'Set API_CLIENT_SECRET for automated token generation, or set API_BEARER_TOKEN with a token generated manually from Insomnia/Postman.'
      )
    }

    throw new Error(
      `Token request failed with ${response.status} ${response.statusText}: ${text}`
    )
  }

  cachedAccessToken = data.access_token ?? data.token

  if (!cachedAccessToken) {
    throw new Error(
      `Token response did not include access_token or token. Response: ${JSON.stringify(data)}`
    )
  }

  return cachedAccessToken
}

export const createDefaultHeaders = () => ({
  ...jsonHeaders,
  ...getAuthHeaders(),
  ...parseJsonEnv('API_HEADERS')
})

export const createAuthorizedHeaders = async () => ({
  ...createDefaultHeaders(),
  Authorization: `Bearer ${await generateApiToken()}`
})

export const buildApiUrl = (path, query = {}) => {
  const resolvedPath = resolveApiPath(path)
  const url = resolvedPath.startsWith('http')
    ? new URL(resolvedPath)
    : new URL(resolvedPath.replace(/^\/+/, ''), `${getApiBaseUrl()}/`)

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  return url
}

export const sendApiRequest = async ({
  method = 'POST',
  path,
  headers = {},
  body,
  query
}) => {
  const url = buildApiUrl(path, query)
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const text = await response.text()
  let data

  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = text
  }

  return {
    data,
    headers: response.headers,
    ok: response.ok,
    request: {
      body,
      headers,
      method,
      url: url.toString()
    },
    status: response.status,
    statusText: response.statusText,
    text
  }
}

export const apiGet = ({ path, headers = {}, query } = {}) =>
  sendApiRequest({
    method: 'GET',
    path,
    headers,
    query
  })

export const apiPost = ({ path, headers = {}, body, query } = {}) =>
  sendApiRequest({
    method: 'POST',
    path,
    headers,
    body,
    query
  })

export const apiPut = ({ path, headers = {}, body, query } = {}) =>
  sendApiRequest({
    method: 'PUT',
    path,
    headers,
    body,
    query
  })

export const apiDelete = ({ path, headers = {}, body, query } = {}) =>
  sendApiRequest({
    method: 'DELETE',
    path,
    headers,
    body,
    query
  })

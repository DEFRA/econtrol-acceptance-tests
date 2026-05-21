import { loadEnv } from './loadEnv.js'

loadEnv()

const dataverseApiVersionPath = '/api/data/v9.2'

const environmentAliases = {
  qa: 'test'
}

const envValue = (...names) => {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }

  return undefined
}

const selectedEnvironment =
  environmentAliases[process.env.TEST_ENV] ?? process.env.TEST_ENV ?? 'dev'

const selectedEnvironmentPrefix = selectedEnvironment.toUpperCase()

const routes = {
  searchPermit: envValue(
    `${selectedEnvironmentPrefix}_SEARCH_PERMIT_API_PATH`,
    'SEARCH_PERMIT_API_PATH'
  ),
  endorsePermit: envValue(
    `${selectedEnvironmentPrefix}_ENDORSE_PERMIT_API_PATH`,
    'ENDORSE_PERMIT_API_PATH'
  ),
  permitHistory: process.env.PERMIT_HISTORY_API_PATH,
  retrievePermit: envValue(
    `${selectedEnvironmentPrefix}_RETRIEVE_PERMIT_API_PATH`,
    'RETRIEVE_PERMIT_API_PATH',
    `${selectedEnvironmentPrefix}_SEARCH_PERMIT_API_PATH`,
    'SEARCH_PERMIT_API_PATH'
  )
}

export const apiRouteConfig = {
  baseUrl: envValue(
    `${selectedEnvironmentPrefix}_DATAVERSE_BASE_URL`,
    'DATAVERSE_BASE_URL',
    'API_BASE_URL'
  ),
  clientId: envValue(
    `${selectedEnvironmentPrefix}_DATAVERSE_CLIENT_ID`,
    'DATAVERSE_CLIENT_ID',
    'API_CLIENT_ID',
    'CLIENT_ID'
  ),
  apiVersionPath: dataverseApiVersionPath,
  environment: selectedEnvironment
}

export const apiPaths = {
  searchPermit: routes.searchPermit ?? 'cites_SearchPermitByNumber',
  endorsePermit: routes.endorsePermit ?? 'cites_EndorsePermit',
  permitHistory: routes.permitHistory,
  retrievePermit: routes.retrievePermit ?? 'cites_SearchPermitByNumber'
}

export const resolveApiPath = (pathOrRouteName) => {
  if (!pathOrRouteName) {
    throw new Error('API path is required.')
  }

  return apiPaths[pathOrRouteName] ?? pathOrRouteName
}

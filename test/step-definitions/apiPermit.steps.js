import { Given, When, Then } from '@wdio/cucumber-framework'
import { expect } from '@wdio/globals'
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  createAuthorizedHeaders,
  createDefaultHeaders,
  generateApiToken,
  sendApiRequest
} from '../utils/apiClient.js'
import { apiPaths } from '../config/apiRoutes.js'
import {
  assertPermitStatus,
  assertResponseConfirmsEndorsement,
  assertResponseExists,
  assertResponseFieldsAreNotNull,
  assertResponseHasFields,
  assertSearchPermitSchema,
  getByPath,
  getPrimaryResponseObject,
  parseJsonDocString,
  tableFieldNames
} from '../utils/apiAssertions.js'

const apiContext = {
  headers: {},
  lastRequestBody: undefined,
  response: undefined
}

const getPermitNumber = () => {
  const responseObject = apiContext.response?.data
    ? getPrimaryResponseObject(apiContext.response.data)
    : {}

  return (
    apiContext.lastRequestBody?.permitNumber ??
    responseObject.permitNumber ??
    getByPath(responseObject, 'permit.permitNumber')
  )
}

const replacePathParams = (path, values) =>
  Object.entries(values).reduce(
    (currentPath, [key, value]) =>
      currentPath.replaceAll(`:${key}`, encodeURIComponent(value)),
    path
  )

const sendPermitLookupRequest = async (permitNumber) => {
  const hasPathParam = apiPaths.retrievePermit.includes(':permitNumber')
  const path = replacePathParams(apiPaths.retrievePermit, { permitNumber })

  return sendApiRequest({
    method: hasPathParam ? 'GET' : 'POST',
    path,
    headers: apiContext.headers,
    body: hasPathParam ? undefined : { permitNumber }
  })
}

const sendCrudRequest = async ({ method, path, body }) => {
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

  apiContext.lastRequestBody = body
  apiContext.response = await requests[method](requestConfig)
}

Given('I set the required API headers', async () => {
  apiContext.headers = createDefaultHeaders()
})

Given('I generate an API token', async () => {
  await generateApiToken({ forceRefresh: true })
  apiContext.headers = await createAuthorizedHeaders()
})

Given('I set the required authorised API headers', async () => {
  apiContext.headers = await createAuthorizedHeaders()
})

Given(/^I have a CITES permit with "([^"]*)" status$/, async (status) => {
  apiContext.requiredPermitStatus = status
})

Given(
  'I send a Search Permit API request with the following body:',
  async (body) => {
    apiContext.lastRequestBody = parseJsonDocString(body)
    apiContext.response = await sendApiRequest({
      method: 'POST',
      path: apiPaths.searchPermit,
      headers: apiContext.headers,
      body: apiContext.lastRequestBody
    })
  }
)

When(
  'I send an Endorse Permit API request with valid endorsement details:',
  async (body) => {
    apiContext.lastRequestBody = parseJsonDocString(body)
    apiContext.response = await sendApiRequest({
      method: 'POST',
      path: apiPaths.endorsePermit,
      headers: apiContext.headers,
      body: apiContext.lastRequestBody
    })
  }
)

When(/^I send a GET API request to "([^"]*)"$/, async (path) => {
  await sendCrudRequest({ method: 'GET', path })
})

When(
  /^I send a POST API request to "([^"]*)" with the following body:$/,
  async (path, body) => {
    await sendCrudRequest({
      method: 'POST',
      path,
      body: parseJsonDocString(body)
    })
  }
)

When(
  /^I send a PUT API request to "([^"]*)" with the following body:$/,
  async (path, body) => {
    await sendCrudRequest({
      method: 'PUT',
      path,
      body: parseJsonDocString(body)
    })
  }
)

When(/^I send a DELETE API request to "([^"]*)"$/, async (path) => {
  await sendCrudRequest({ method: 'DELETE', path })
})

When(
  /^I send a DELETE API request to "([^"]*)" with the following body:$/,
  async (path, body) => {
    await sendCrudRequest({
      method: 'DELETE',
      path,
      body: parseJsonDocString(body)
    })
  }
)

When('the API response is returned successfully', async () => {
  assertResponseExists(apiContext)
})

Then(/^the response status code should be (\d+)$/, async (expectedStatus) => {
  assertResponseExists(apiContext)
  expect(apiContext.response.status).toBe(Number(expectedStatus))
})

Then('the response should contain the following fields:', async (dataTable) => {
  assertResponseExists(apiContext)
  assertResponseHasFields(apiContext.response.data, tableFieldNames(dataTable))
})

Then('the following fields should not be null:', async (dataTable) => {
  assertResponseExists(apiContext)
  assertResponseFieldsAreNotNull(
    apiContext.response.data,
    tableFieldNames(dataTable)
  )
})

Then('the response should match the Search Permit API schema', async () => {
  assertResponseExists(apiContext)
  assertSearchPermitSchema(apiContext.response.data)
})

Then('the response should confirm the permit has been endorsed', async () => {
  assertResponseExists(apiContext)
  assertResponseConfirmsEndorsement(apiContext.response.data)
})

Then(/^the permit status should be updated to "([^"]*)"$/, async (status) => {
  assertResponseExists(apiContext)
  assertPermitStatus(apiContext.response.data, status)
})

Then('Pegasus should record the endorsement in permit history', async () => {
  assertResponseExists(apiContext)

  const responseObject = getPrimaryResponseObject(apiContext.response.data)
  const inlineHistory =
    responseObject.history ??
    responseObject.permitHistory ??
    responseObject.events ??
    responseObject.auditHistory

  if (inlineHistory) {
    expect(JSON.stringify(inlineHistory).toLowerCase()).toContain('endors')
    return
  }

  if (!apiPaths.permitHistory) {
    throw new Error(
      'Permit history was not included in the endorsement response. Set PERMIT_HISTORY_API_PATH to verify Pegasus history.'
    )
  }

  const permitNumber = getPermitNumber()
  const path = replacePathParams(apiPaths.permitHistory, { permitNumber })
  const historyResponse = await sendApiRequest({
    method: 'GET',
    path,
    headers: apiContext.headers
  })

  expect(historyResponse.status).toBe(200)
  expect(JSON.stringify(historyResponse.data).toLowerCase()).toContain('endors')
})

Then(
  'the endorsed permit should be retrievable by authorised users',
  async () => {
    assertResponseExists(apiContext)

    const permitNumber = getPermitNumber()

    if (!permitNumber) {
      throw new Error('Could not determine permit number to retrieve.')
    }

    const retrieveResponse = await sendPermitLookupRequest(permitNumber)

    expect(retrieveResponse.status).toBe(200)
    assertResponseHasFields(retrieveResponse.data, ['permitNumber'])
    assertPermitStatus(retrieveResponse.data, 'Endorsed')
  }
)

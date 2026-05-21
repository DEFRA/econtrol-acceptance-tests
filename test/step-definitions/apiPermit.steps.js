import { Given, When, Then } from '@wdio/cucumber-framework'
import { expect } from '@wdio/globals'
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
import { resolveEnvPlaceholders } from '../utils/envPlaceholders.js'
import {
  apiContext,
  generateApiTokenAndSetHeaders,
  getInlinePermitHistory,
  getPermitNumber,
  sendCrudRequest,
  sendEndorsePermitRequest,
  sendPermitHistoryRequest,
  sendPermitLookupRequest,
  sendSearchPermitRequest,
  setAuthorizedApiHeaders,
  setDefaultApiHeaders,
  setRequiredPermitStatus
} from '../utils/apiPermit.js'

Given('I set the required API headers', async () => {
  setDefaultApiHeaders()
})

Given('I generate an API token', async () => {
  await generateApiTokenAndSetHeaders()
})

Given('I set the required authorised API headers', async () => {
  await setAuthorizedApiHeaders()
})

Given(/^I have a CITES permit with "([^"]*)" status$/, async (status) => {
  setRequiredPermitStatus(status)
})

Given(
  'I send a Search Permit API request with the following body:',
  async (body) => {
    await sendSearchPermitRequest(
      resolveEnvPlaceholders(parseJsonDocString(body))
    )
  }
)

When(
  'I send an Endorse Permit API request with valid endorsement details:',
  async (body) => {
    await sendEndorsePermitRequest(
      resolveEnvPlaceholders(parseJsonDocString(body))
    )
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
  const expected = Number(expectedStatus)

  if (apiContext.response.status !== expected) {
    throw new Error(
      `Expected API response status ${expected}, but received ${apiContext.response.status} ${apiContext.response.statusText}.\n` +
        `Request: ${apiContext.response.request.method} ${apiContext.response.request.url}\n` +
        `Request body: ${JSON.stringify(apiContext.response.request.body)}\n` +
        `Response body: ${apiContext.response.text}`
    )
  }
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

Then('the response should contain the following values:', async (dataTable) => {
  assertResponseExists(apiContext)
  const responseObject = getPrimaryResponseObject(apiContext.response.data)

  for (const row of dataTable.hashes()) {
    const field = row.Field ?? row.field
    const expectedRaw = row.Value ?? row.value

    if (!field) {
      throw new Error(`Expected a Field column. Row: ${JSON.stringify(row)}`)
    }

    const actualValue = getByPath(responseObject, field)
    const expectedValue = resolveEnvPlaceholders(expectedRaw)

    expect(actualValue?.toString()).toBe(expectedValue?.toString())
  }
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

  const inlineHistory = getInlinePermitHistory()

  if (inlineHistory) {
    expect(JSON.stringify(inlineHistory).toLowerCase()).toContain('endors')
    return
  }

  const historyResponse = await sendPermitHistoryRequest()

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

const SEARCH_PERMIT_SCHEMA = {
  permitId: ['number', 'string'],
  permitNumber: ['string'],
  permitType: ['string'],
  statusLabel: ['string'],
  statuscode: ['number', 'string'],
  scientificName: ['string'],
  purposeCode: ['string']
}

const objectCandidateKeys = ['data', 'result', 'permit', 'response']
const arrayCandidateKeys = ['data', 'results', 'permits', 'items', 'content']

export const parseJsonDocString = (docString) => {
  try {
    return JSON.parse(docString)
  } catch (error) {
    throw new Error(`Request body must be valid JSON. ${error.message}`, {
      cause: error
    })
  }
}

export const tableFieldNames = (dataTable) =>
  dataTable
    .hashes()
    .map((row) => row.Field ?? row.field)
    .filter(Boolean)

export const getByPath = (value, path) =>
  path.split('.').reduce((current, key) => current?.[key], value)

export const getResponseItems = (payload) => {
  if (Array.isArray(payload)) return payload

  if (payload && typeof payload === 'object') {
    for (const key of arrayCandidateKeys) {
      const value = payload[key]
      if (Array.isArray(value)) return value
    }
  }

  return payload ? [payload] : []
}

export const getPrimaryResponseObject = (payload) => {
  const [firstItem] = getResponseItems(payload)

  if (!firstItem || typeof firstItem !== 'object') {
    throw new Error(
      `Expected API response to contain an object, but received: ${JSON.stringify(payload)}`
    )
  }

  for (const key of objectCandidateKeys) {
    const value = firstItem[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value
    }
  }

  return firstItem
}

export const assertResponseExists = (context) => {
  if (!context.response) {
    throw new Error(
      'No API response found. Send an API request before asserting the response.'
    )
  }
}

export const assertResponseHasFields = (payload, fields) => {
  const responseObject = getPrimaryResponseObject(payload)
  const missingFields = fields.filter(
    (field) => getByPath(responseObject, field) === undefined
  )

  if (missingFields.length > 0) {
    throw new Error(
      `Response is missing expected field(s): ${missingFields.join(', ')}.\n` +
        `Response: ${JSON.stringify(responseObject, null, 2)}`
    )
  }
}

export const assertResponseFieldsAreNotNull = (payload, fields) => {
  const responseObject = getPrimaryResponseObject(payload)
  const nullFields = fields.filter((field) => {
    const value = getByPath(responseObject, field)
    return value === null || value === undefined || value === ''
  })

  if (nullFields.length > 0) {
    throw new Error(
      `Response field(s) should not be null or empty: ${nullFields.join(', ')}.\n` +
        `Response: ${JSON.stringify(responseObject, null, 2)}`
    )
  }
}

export const assertSearchPermitSchema = (payload) => {
  const responseObject = getPrimaryResponseObject(payload)
  const errors = []

  for (const [field, allowedTypes] of Object.entries(SEARCH_PERMIT_SCHEMA)) {
    const value = getByPath(responseObject, field)

    if (value === undefined || value === null || value === '') {
      errors.push(`${field} is required`)
      continue
    }

    if (!allowedTypes.includes(typeof value)) {
      errors.push(
        `${field} expected type ${allowedTypes.join(' or ')}, received ${typeof value}`
      )
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Search Permit API schema mismatch:\n${errors.join('\n')}\n` +
        `Response: ${JSON.stringify(responseObject, null, 2)}`
    )
  }
}

export const assertPermitStatus = (payload, expectedStatus) => {
  const responseObject = getPrimaryResponseObject(payload)
  const candidates = [
    responseObject.statusLabel,
    responseObject.status,
    responseObject.permitStatus,
    responseObject.statuscode,
    responseObject.statusCode
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => value.toString().toLowerCase())

  if (!candidates.includes(expectedStatus.toLowerCase())) {
    throw new Error(
      `Expected permit status "${expectedStatus}", but found ${JSON.stringify(candidates)}.\n` +
        `Response: ${JSON.stringify(responseObject, null, 2)}`
    )
  }
}

export const assertResponseConfirmsEndorsement = (payload) => {
  const responseObject = getPrimaryResponseObject(payload)
  const responseText = JSON.stringify(responseObject).toLowerCase()

  if (!responseText.includes('endors')) {
    throw new Error(
      `Expected response to confirm endorsement.\nResponse: ${JSON.stringify(responseObject, null, 2)}`
    )
  }
}

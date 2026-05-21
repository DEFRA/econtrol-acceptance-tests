import { expect } from '@wdio/globals'

export const valuesFromTableColumn = (dataTable, columnNames) =>
  dataTable.hashes().map((row) => firstDefinedValue(row, columnNames) ?? '')

export const columnNamesFromTable = (dataTable) =>
  dataTable.hashes().map((row) => row.Column)

export const assertRowsMatch = (actualRows, expectedRows) => {
  expect(actualRows.length).toBe(expectedRows.length)

  expectedRows.forEach((expected, index) => {
    assertRowMatches(actualRows[index], expected, index)
  })
}

export const assertEveryRowMatches = (actualRows, expected) => {
  if (!expected) {
    throw new Error(
      'Expected exactly one template row in the data table for ' +
        '"every result should have the following values".'
    )
  }

  expect(actualRows.length).toBeGreaterThan(0)

  actualRows.forEach((actual, index) => {
    assertRowMatches(actual, expected, index)
  })
}

export const assertRowsHaveColumns = (rows, columns) => {
  expect(rows.length).toBeGreaterThan(0)

  rows.forEach((row, rowIndex) => {
    for (const column of columns) {
      const value = (row[column] ?? '').toString().trim()

      if (value === '') {
        throw new Error(
          `Row ${rowIndex + 1} is missing data in the "${column}" column. ` +
            `Row contents: ${JSON.stringify(row)}`
        )
      }
    }
  })
}

export const assertValuesMatchSearchTerms = (
  values,
  searchTerms,
  valueLabel = 'values'
) => {
  const normalisedSearchTerms = searchTerms.map((term) => term.toLowerCase())

  expect(values.length).toBeGreaterThan(0)

  for (const value of values) {
    const lower = value.toLowerCase()
    const matchesAny = normalisedSearchTerms.some((term) =>
      lower.includes(term)
    )

    if (!matchesAny) {
      throw new Error(
        `Result "${value}" does not match any of the searched ` +
          `${valueLabel}: ${searchTerms.join(', ')}`
      )
    }
  }
}

const firstDefinedValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key]
    }
  }

  return undefined
}

const assertRowMatches = (actual, expected, index) => {
  for (const [column, expectedValue] of Object.entries(expected)) {
    const actualValue = (actual?.[column] ?? '').toString().trim()

    if (actualValue !== expectedValue) {
      throw new Error(
        `Row ${index + 1}, column "${column}" mismatch.\n` +
          `  Expected: "${expectedValue}"\n` +
          `  Actual:   "${actualValue}"\n` +
          `  Full row: ${JSON.stringify(actual)}`
      )
    }
  }
}

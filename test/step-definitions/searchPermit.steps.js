import { Given, When, Then } from '@wdio/cucumber-framework'
import { browser, expect } from '@wdio/globals'
import searchPermitPage from '../page-objects/searchPermit.page'

Given(/^I am on the Search Permit page$/, async () => {
  await searchPermitPage.open()
})

Given(/^I can see the title "([^"]*)"$/, async (expectedTitle) => {
  await expect(searchPermitPage.pageHeading).toBeDisplayed()
  await expect(searchPermitPage.pageHeading).toHaveText(expectedTitle)
})

Given(/^I enter password "([^"]*)"$/, async (password) => {
  await searchPermitPage.enterPassword(password)
})

Given(/click on continue/, async () => {
  await searchPermitPage.clickContinue()
})

Given(/I click on empty search permit/, async () => {
  await searchPermitPage.openEmptySearch()
})

When(
  /^I search using (?:a valid )?permit number "([^"]*)"$/,
  async (permitNumber) => {
    await searchPermitPage.search(permitNumber)
  }
)

When(/^I search using the following permit numbers:$/, async (dataTable) => {
  const permitNumbers = dataTable
    .hashes()
    .map((row) => row['Permit number'] ?? row['permit number'] ?? '')
  await searchPermitPage.search(permitNumbers)
})

When(/^I search for the following permits:$/, async (dataTable) => {
  const expectedResults = dataTable.hashes()
  await searchPermitPage.searchForExpectedPermits(expectedResults)
})

When(/I click on Change Search/, async () => {
  await searchPermitPage.clickChangeSearch()
})

Then(
  /^I should see a message showing the number of permits that matched my search$/,
  async () => {
    await expect(searchPermitPage.resultsMessage).toBeDisplayed()
    const text = await searchPermitPage.getResultsMessageText()
    expect(text).toMatch(/\d+/)
  }
)

Then(
  /^the number of displayed permit results should match the count shown in the message$/,
  async () => {
    const expected = await searchPermitPage.getResultsCountFromMessage()
    console.log(expected)
    const actual = await searchPermitPage.getDisplayedResultsCount()
    console.log(actual)
    expect(actual).toBe(expected)
  }
)

Then(
  /^the displayed permit results should match the search criteria$/,
  async () => {
    const searchedList = searchPermitPage.lastSearchedAsList.map((s) =>
      s.toLowerCase()
    )
    const permitNumberValues = await searchPermitPage.getColumnValues(0)

    expect(permitNumberValues.length).toBeGreaterThan(0)

    for (const value of permitNumberValues) {
      const lower = value.toLowerCase()
      const matchesAny = searchedList.some((s) => lower.includes(s))
      if (!matchesAny) {
        throw new Error(
          `Result "${value}" does not match any of the searched ` +
            `permit numbers: ${searchPermitPage.lastSearchedAsList.join(', ')}`
        )
      }
    }
  }
)

Then(
  /^each result should display the following columns:$/,
  async (dataTable) => {
    const expectedColumns = dataTable.hashes().map((row) => row.Column)
    const actualHeaders = await searchPermitPage.getResultsTableHeaders()

    for (const column of expectedColumns) {
      expect(actualHeaders).toContain(column)
    }

    const rows = await searchPermitPage.getResultsAsObjects()
    expect(rows.length).toBeGreaterThan(0)

    rows.forEach((row, rowIndex) => {
      for (const column of expectedColumns) {
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
)

Then(/^I should see a no matching permits or validation message$/, async () => {
  await browser.waitUntil(
    async () => searchPermitPage.isAnyEmptyStateVisible(),
    {
      timeout: 10000,
      timeoutMsg:
        'Expected either a "no matching permits" message or a validation error to be visible.'
    }
  )
})

Then(/^I should see the message "([^"]*)" for invalid$/, async (expectedMessage) => {
  await browser.waitUntil(
    async () => {
      const text = await searchPermitPage.getVisibleStatusText()
      return text.toLowerCase().includes(expectedMessage.toLowerCase())
    },
    {
      timeout: 10000,
      timeoutMsg: `Expected to see the message "${expectedMessage}" on the page.`
    }
  )
})

Then(/^I should see the following permit results for valid:$/, async (dataTable) => {
  const expectedRows = dataTable.hashes()
  const actualRows = await searchPermitPage.getResultsAsObjects()

  expect(actualRows.length).toBe(expectedRows.length)

  expectedRows.forEach((expected, i) => {
    const actual = actualRows[i]
    for (const [column, expectedValue] of Object.entries(expected)) {
      const actualValue = (actual?.[column] ?? '').toString().trim()
      if (actualValue !== expectedValue) {
        throw new Error(
          `Row ${i + 1}, column "${column}" mismatch.\n` +
            `  Expected: "${expectedValue}"\n` +
            `  Actual:   "${actualValue}"\n` +
            `  Full row: ${JSON.stringify(actual)}`
        )
      }
    }
  })
})

Then(/^every result should have the following values:$/, async (dataTable) => {
  const expected = dataTable.hashes()[0]
  if (!expected) {
    throw new Error(
      'Expected exactly one template row in the data table for ' +
        '"every result should have the following values".'
    )
  }

  const actualRows = await searchPermitPage.getResultsAsObjects()
  expect(actualRows.length).toBeGreaterThan(0)

  actualRows.forEach((actual, i) => {
    for (const [column, expectedValue] of Object.entries(expected)) {
      const actualValue = (actual?.[column] ?? '').toString().trim()
      if (actualValue !== expectedValue) {
        throw new Error(
          `Row ${i + 1}, column "${column}" mismatch.\n` +
            `  Expected: "${expectedValue}"\n` +
            `  Actual:   "${actualValue}"\n` +
            `  Full row: ${JSON.stringify(actual)}`
        )
      }
    }
  })
})

Then('the search input field should be visible', async () => {
  const input = await searchPermitPage.permitNumberInput
  await input.waitForDisplayed()
  await input.waitForEnabled()
})

Then(/^the displayed results should match the expected permits$/, async () => {
  const expected = searchPermitPage.expectedResults
  if (!expected || expected.length === 0) {
    throw new Error(
      'No expected results were captured. ' +
        'Use "When I search for the following permits:" before this step.'
    )
  }

  const actual = await searchPermitPage.getResultsAsObjects()
  expect(actual.length).toBe(expected.length)

  expected.forEach((expectedRow, i) => {
    const actualRow = actual[i]
    for (const [column, expectedValue] of Object.entries(expectedRow)) {
      const actualValue = (actualRow?.[column] ?? '').toString().trim()
      if (actualValue !== expectedValue) {
        throw new Error(
          `Row ${i + 1}, column "${column}" mismatch.\n` +
            `  Expected: "${expectedValue}"\n` +
            `  Actual:   "${actualValue}"\n` +
            `  Full row: ${JSON.stringify(actualRow)}`
        )
      }
    }
  })
})

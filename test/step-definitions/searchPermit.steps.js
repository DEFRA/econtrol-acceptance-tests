import { Given, When, Then } from '@wdio/cucumber-framework'
import { browser, expect } from '@wdio/globals'
import searchPermitPage from '../page-objects/searchPermit.page'
import {
  assertEveryRowMatches,
  assertRowsHaveColumns,
  assertRowsMatch,
  assertValuesMatchSearchTerms,
  columnNamesFromTable,
  valuesFromTableColumn
} from '../utils/tableAssertions.js'

Given(/^I am on the Search Permit page$/, async () => {
  await searchPermitPage.ensureReady({
    email: process.env.EMAIL,
    password: process.env.PASSWORD
  })
})

Given(/^I can see the title "([^"]*)"$/, async (expectedTitle) => {
  await expect(searchPermitPage.pageHeading).toBeDisplayed()
  await expect(searchPermitPage.pageHeading).toHaveText(expectedTitle)
})

Given(/^I enter password$/, async () => {
  await searchPermitPage.enterPassword(process.env.PASSWORD)
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
  await searchPermitPage.search(
    valuesFromTableColumn(dataTable, ['Permit number', 'permit number'])
  )
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
    const actual = await searchPermitPage.getDisplayedResultsCount()
    expect(actual).toBe(expected)
  }
)

Then(
  /^the displayed permit results should match the search criteria$/,
  async () => {
    const permitNumberValues = await searchPermitPage.getColumnValues(0)
    assertValuesMatchSearchTerms(
      permitNumberValues,
      searchPermitPage.lastSearchedAsList,
      'permit numbers'
    )
  }
)

Then(
  /^each result should display the following columns:$/,
  async (dataTable) => {
    const expectedColumns = columnNamesFromTable(dataTable)
    const actualHeaders = await searchPermitPage.getResultsTableHeaders()

    for (const column of expectedColumns) {
      expect(actualHeaders).toContain(column)
    }

    const rows = await searchPermitPage.getResultsAsObjects()
    assertRowsHaveColumns(rows, expectedColumns)
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

Then(
  /^I should see the message "([^"]*)" for invalid$/,
  async (expectedMessage) => {
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
  }
)

Then(
  /^I should see the following permit results for valid:$/,
  async (dataTable) => {
    const expectedRows = dataTable.hashes()
    const actualRows = await searchPermitPage.getResultsAsObjects()

    assertRowsMatch(actualRows, expectedRows)
  }
)

Then(/^every result should have the following values:$/, async (dataTable) => {
  const expected = dataTable.hashes()[0]
  const actualRows = await searchPermitPage.getResultsAsObjects()

  assertEveryRowMatches(actualRows, expected)
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

  assertRowsMatch(actual, expected)
})

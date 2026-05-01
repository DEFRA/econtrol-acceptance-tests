import { $ } from '@wdio/globals'
import { Page } from './page.js'

const TABLE_HEADER_ALIASES = {
  Quantity: ['Quantity or net mass']
}

/**
 * Search Permit page 
 */
class SearchPermitPage extends Page {
  constructor() {
    super()
    this._lastSearched = ''
    this._expectedResults = []
  }

  open() {
    const start = process.env.WDIO_SEARCH_PERMIT_START_PATH ?? '/'
    return super.open(start)
  }

  async openEmptySearch() {
    const path =
      process.env.WDIO_SEARCH_PERMIT_EMPTY_PATH ??
      '/beta-28-05-26/single-search-results/search-results?empty=1'

    return super.open(path)
  }

  // -------------------------
  // Selectors
  // -------------------------

  get password() {
    return $('#password')
  }

  get continue() {
    return $("//button[@type='sumit']")
  }

  get permitNumberInput() {
    return $('#permitReferences')
  }

  get searchButton() {
    return $("button[name='search']")
  }

  get resultsMessage() {
    return $('*=permits that matched your search')
  }

  get resultsTable() {
    return $('table.govuk-table, table')
  }

  get resultRows() {
    return this.resultsTable.$$('tbody tr')
  }

  get noMatchMessage() {
    return $('*=No permits found')
  }

  get permitFieldError() {
    return $('#permitReferences-error')
  }

  get permitNotFoundBanner() {
    return $('#govuk-notification-banner-title-permit-not-found')
  }

  get errorMessage() {
    return this.permitNotFoundBanner
  }

  get changeSearch() {
    return $("//a[contains(text(), 'Change your search')]")
  }

  // -------------------------
  // State getters
  // -------------------------

  get expectedResults() {
    return this._expectedResults
  }

  get lastSearched() {
    return this._lastSearched
  }

  get lastSearchedAsList() {
    return String(this._lastSearched ?? '')
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean)
  }

  // -------------------------
  // Actions
  // -------------------------

  async enterPassword(password) {
    const exists = await this.password.isExisting()
    if (!exists) return

    await this.password.setValue(password)
  }

  async clickContinue() {
    const exists = await this.continue.isExisting()
    if (!exists) return

    await this.continue.waitForClickable()
    await this.continue.click()
  }

  async enterPermits(permitNumbers) {
    const list = (
      Array.isArray(permitNumbers) ? permitNumbers : [permitNumbers]
    )
      .map((number) => (number ?? '').toString().trim())
      .filter(Boolean)

    this._lastSearched = list.join('\n')

    await this.permitNumberInput.waitForDisplayed({ timeout: 10000 })
    await this.permitNumberInput.setValue(this._lastSearched)
  }

  async clickSearch() {
    await this.searchButton.waitForClickable()
    await this.searchButton.click()
  }

  async search(permitNumbers) {
    await this.enterPermits(permitNumbers)
    await this.clickSearch()
  }

  async searchForExpectedPermits(expectedResults) {
    this._expectedResults = expectedResults

    const permitNumbers = expectedResults
      .map((row) =>
        (row['Permit number'] ?? row['permit number'] ?? '').toString().trim()
      )
      .filter(Boolean)

    await this.search(permitNumbers)
  }

  async clickChangeSearch() {
    await this.changeSearch.waitForClickable({ timeout: 10000 })
    await this.changeSearch.click()
  }

  // -------------------------
  // Results message helpers
  // -------------------------

  async getResultsMessageText() {
    await this.resultsMessage.waitForDisplayed({ timeout: 10000 })
    return this.resultsMessage.getText()
  }

  async getResultsCountFromMessage() {
    const text = await this.getResultsMessageText()
    const match = text.match(/(\d+)/)

    return match ? parseInt(match[1], 10) : 0
  }

  async getDisplayedResultsCount() {
    const rows = await this.elementArrayToList(this.resultRows)
    return rows.length
  }

  // -------------------------
  // Table helpers
  // -------------------------

  async elementArrayToList(maybe) {
    const resolved = await maybe

    if (resolved == null) return []
    if (Array.isArray(resolved)) return [...resolved]

    const length = Number(resolved.length)
    if (!Number.isFinite(length) || length <= 0) return []

    const items = []

    for (let i = 0; i < length; i++) {
      if (resolved[i] != null) {
        items.push(resolved[i])
      }
    }

    return items
  }

  async getResultsTableHeaders() {
    const table = this.resultsTable
    await table.waitForDisplayed({ timeout: 10000 })

    const headerElements = await this.elementArrayToList(table.$$('thead th'))
    const headers = []

    for (let i = 0; i < headerElements.length; i++) {
      headers.push(await headerElements[i].getText())
    }

    return headers.map((header) => header.replace(/\s+/g, ' ').trim())
  }

  async getColumnValues(columnIndex) {
    const rows = await this.elementArrayToList(this.resultRows)
    const values = []

    for (let i = 0; i < rows.length; i++) {
      const cells = await this.elementArrayToList(rows[i].$$('td'))

      if (cells[columnIndex]) {
        values.push(await cells[columnIndex].getText())
      }
    }

    return values
  }

  applyTableHeaderAliases(rowObj) {
    if (rowObj == null || typeof rowObj !== 'object') {
      return rowObj
    }

    for (const [alias, domHeaders] of Object.entries(TABLE_HEADER_ALIASES)) {
      if (!Array.isArray(domHeaders)) continue

      const existing = (rowObj[alias] ?? '').toString().trim()
      if (existing !== '') continue

      for (const header of domHeaders) {
        const value = (rowObj[header] ?? '').toString().trim()

        if (value !== '') {
          rowObj[alias] = value
          break
        }
      }
    }

    return rowObj
  }

  async getResultsAsObjects() {
    const headers = await this.getResultsTableHeaders()
    const rows = await this.elementArrayToList(this.resultRows)
    const results = []

    for (let r = 0; r < rows.length; r++) {
      const cells = await this.elementArrayToList(rows[r].$$('td'))
      const cellTexts = []

      for (let c = 0; c < cells.length; c++) {
        cellTexts.push(await cells[c].getText())
      }

      const rowObj = {}

      headers.forEach((header, index) => {
        rowObj[header] = (cellTexts[index] ?? '').toString().trim()
      })

      this.applyTableHeaderAliases(rowObj)
      results.push(rowObj)
    }

    return results
  }

  // -------------------------
  // Empty / error state helpers
  // -------------------------

  async isAnyEmptyStateVisible() {
    const sources = [
      this.permitFieldError,
      this.permitNotFoundBanner,
      this.noMatchMessage
    ]

    for (const el of sources) {
      if (await this.safeIsDisplayed(el)) {
        return true
      }
    }

    return false
  }

  async searchOutcomeMessageIncludes(substring) {
    const needle = substring.toLowerCase().trim()
    if (!needle) return false

    const sources = [this.permitFieldError, this.permitNotFoundBanner]

    for (const el of sources) {
      if (await this.safeIsDisplayed(el)) {
        try {
          const text = (await el.getText()).toLowerCase()
          if (text.includes(needle)) return true
        } catch {
          // Ignore stale element errors
        }
      }
    }

    return false
  }

  async getVisibleStatusText() {
    const ordered = [
      this.permitFieldError,
      this.permitNotFoundBanner,
      this.noMatchMessage,
      this.resultsMessage
    ]

    for (const el of ordered) {
      if (await this.safeIsDisplayed(el)) {
        return el.getText()
      }
    }

    return ''
  }

  async safeIsDisplayed(el) {
    if (el == null || typeof el.isDisplayed !== 'function') {
      return false
    }

    try {
      return await el.isDisplayed()
    } catch {
      return false
    }
  }
}

const searchPermitPage = new SearchPermitPage()

export { SearchPermitPage }
export default searchPermitPage

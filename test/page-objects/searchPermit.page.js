import { $ } from '@wdio/globals'
import { Page } from './page.js'

const TABLE_HEADER_ALIASES = {
  Quantity: ['Quantity or net mass']
}

/**
 * Search Permit page — eControl / GOV.UK prototype.
 *
 * Do **not** use `await $$('table…')` + `Promise.all(headers.map(…))` or
 * `for…of` on raw WDIO element lists: they are often non-iterable. Use
 * `elementArrayToList`, scope rows/headers via `this.resultsTable.$$`, and
 * index loops for `getText()`.
 *
 * Default export is a singleton so steps share `this._lastSearched` in a scenario.
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
  
  
  get password() {
    return $('#password')
  }

  get continue() {
    return $("//button[@type='submit']")
  }

  get permitNumberInput() {
    return $('#permitReferences')
  }

  get searchButton() {
    return $('button[name=\'search\']')
  }

  get resultsMessage() {
    return $('*=permits that matched your search')
  }

  get resultsTable() {
    return $('table.govuk-table, table')
  }


  get noMatchMessage() {
    return $('*=No permits found')
  }

  get permitFieldError() {
    return $('#permitReferences-error')
  }

  /** Notification title when search returns no permits (invalid / unknown numbers). */
  get permitNotFoundBanner() {
    return $('#govuk-notification-banner-title-permit-not-found')
  }

  /** Alias for {@link permitNotFoundBanner} (matches common naming in tests). */
  get errorMessage() {
    return this.permitNotFoundBanner
  }

  async openEmptySearch() {
    const path =
      process.env.WDIO_SEARCH_PERMIT_EMPTY_PATH ??
      '/beta-28-05-26/single-search-results/search-results?empty=1'
    return super.open(path)
  }

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

  async clickSearch() {
    await this.searchButton.waitForClickable()
    await this.searchButton.click()
  }

  async search(permitNumbers) {
    await this.enterPermits(permitNumbers)
    await this.clickSearch()
  }

  async enterPermits(permitNumbers) {
    const list = (Array.isArray(permitNumbers) ? permitNumbers : [permitNumbers])
      .map((n) => (n ?? '').toString().trim())
      .filter(Boolean)

    this._lastSearched = list.join('\n')

    await this.permitNumberInput.waitForDisplayed({ timeout: 10000 })
    await this.permitNumberInput.setValue(list.join('\n'))
  }

  async searchForExpectedPermits(expectedResults) {
    this._expectedResults = expectedResults

    const permitNumbers = expectedResults
      .map((row) =>
        (row['Permit number'] ?? row['permit number'] ?? '').toString().trim()
      )
      .filter(Boolean)

    return this.search(permitNumbers)
  }

  get expectedResults() {
    return this._expectedResults
  }

  get lastSearched() {
    return this._lastSearched
  }

  get resultRows() {
    return this.resultsTable.$$('tbody tr')
  }

  get lastSearchedAsList() {
    const raw = this._lastSearched ?? ''
    return String(raw)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async getResultsMessageText() {
    await this.resultsMessage.waitForDisplayed({ timeout: 10000 })
    return this.resultsMessage.getText()
  }

  async getResultsCountFromMessage() {
    const text = await this.getResultsMessageText()
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  



  /**
   * WDIO element collections are often array-like but have a broken or missing
   * `Symbol.iterator` — never spread/`for...of` them. Copy by numeric index only.
   */
  async elementArrayToList(maybe) {
    const resolved = await maybe
    if (resolved == null) {
      return []
    }
    if (Array.isArray(resolved)) {
      return [...resolved]
    }
    const len = Number(resolved.length)
    if (!Number.isFinite(len) || len <= 0) {
      return []
    }
    const out = []
    for (let i = 0; i < len; i++) {
      const el = resolved[i]
      if (el != null) {
        out.push(el)
      }
    }
    return out
  }

  async getResultsTableHeaders() {
    const table = this.resultsTable
    await table.waitForDisplayed({ timeout: 10000 })
    const headerEls = await this.elementArrayToList(table.$$('thead th'))
    const texts = []
    for (let i = 0; i < headerEls.length; i++) {
      texts.push(await headerEls[i].getText())
    }
    return texts.map((t) => t.replace(/\s+/g, ' ').trim())
  }

  async getColumnValues(columnIndex) {
    const rows = await this.elementArrayToList(this.resultRows)
    const values = []
    for (const row of rows) {
      const cells = await this.elementArrayToList(row.$$('td'))
      if (cells[columnIndex]) {
        values.push(await cells[columnIndex].getText())
      }
    }
    return values
  }
  /**
   * Copy values from DOM header names onto shorter / stable alias keys so
   * assertions and {@link getColumnValues} stay aligned with Gherkin.
   */
   applyTableHeaderAliases(rowObj) {
    if (rowObj == null || typeof rowObj !== 'object') {
      return rowObj
    }
    for (const [alias, domHeaders] of Object.entries(TABLE_HEADER_ALIASES)) {
      if (!Array.isArray(domHeaders)) {
        continue
      }
      const existing = (rowObj[alias] ?? '').toString().trim()
      if (existing !== '') continue
      for (const h of domHeaders) {
        const v = (rowObj[h] ?? '').toString().trim()
        if (v !== '') {
          rowObj[alias] = v
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

    for (const row of rows) {
      const cells = await this.elementArrayToList(row.$$('td'))
      const cellTexts = []
      for (let c = 0; c < cells.length; c++) {
        cellTexts.push(await cells[c].getText())
      }
      const rowObj = {}
      headers.forEach((header, i) => {
        rowObj[header] = (cellTexts[i] ?? '').toString().trim()
      })
      this.applyTableHeaderAliases(rowObj)
      results.push(rowObj)
    }

    return results
  }
  async getDisplayedResultsCount() {
    const rows = await this.elementArrayToList(this.resultRows)
    return rows.length
  }

  async isAnyEmptyStateVisible() {
    const sources = [
      this.permitFieldError,
      this.permitNotFoundBanner,
      this.noMatchMessage,
      this.validationError
    ]
    for (const el of sources) {
      if (await this.safeIsDisplayed(el)) {
        return true
      }
    }
    return false
  }

  /**
   * True if `substring` appears in either the empty-search field error or the
   * no-permits notification title — **does not** read the results table.
   */
  async searchOutcomeMessageIncludes(substring) {
    const needle = substring.toLowerCase().trim()
    if (!needle) return false

    const field = this.permitFieldError
    if (await this.safeIsDisplayed(field)) {
      try {
        const t = (await field.getText()).toLowerCase()
        if (t.includes(needle)) return true
      } catch {
        /* stale */
      }
    }
    const banner = this.permitNotFoundBanner
    if (await this.safeIsDisplayed(banner)) {
      try {
        const t = (await banner.getText()).toLowerCase()
        if (t.includes(needle)) return true
      } catch {
        /* stale */
      }
    }
    return false
  }

    async getVisibleStatusText() {
    const ordered = [
      this.permitFieldError,
      this.permitNotFoundBanner,
      this.validationError,
      this.noMatchMessage,
      this.resultsMessage
    ].filter((el) => el != null && typeof el.isDisplayed === 'function')

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

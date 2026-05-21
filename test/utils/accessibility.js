import AxeBuilder from '@axe-core/webdriverio'
import { browser } from '@wdio/globals'

const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const PAGE_READY_RETRIES = 2
const PAGE_READY_RETRY_DELAY_MS = 1000

const formatNode = (node) => {
  const target = node.target?.join(', ') ?? 'unknown target'
  const summary = node.failureSummary
    ? `\n      ${node.failureSummary.replace(/\n/g, '\n      ')}`
    : ''

  return `    - ${target}${summary}`
}

const formatViolation = (violation) => {
  const nodes = violation.nodes.slice(0, 3).map(formatNode).join('\n')
  const remaining =
    violation.nodes.length > 3
      ? `\n    - ...and ${violation.nodes.length - 3} more node(s)`
      : ''

  return [
    `${violation.id} (${violation.impact ?? 'unknown impact'})`,
    `  Help: ${violation.help}`,
    `  More info: ${violation.helpUrl}`,
    `  Nodes:\n${nodes}${remaining}`
  ].join('\n')
}

const formatViolations = (violations) =>
  violations.map(formatViolation).join('\n\n')

const waitForPageReady = async () => {
  await browser.waitUntil(
    async () => {
      const readyState = await browser.execute(() => document.readyState)
      return readyState === 'complete'
    },
    {
      timeout: 10000,
      timeoutMsg:
        'Expected page document to be ready before accessibility scan.'
    }
  )

  await browser.$('body').waitForExist({ timeout: 10000 })
}

const runAxeScan = async () =>
  new AxeBuilder({ client: browser }).withTags(DEFAULT_TAGS).analyze()

const isPageFrameNotReadyError = (error) =>
  error?.message?.includes('Page/Frame is not ready')

export const checkPageAccessibility = async () => {
  let results

  for (let attempt = 1; attempt <= PAGE_READY_RETRIES; attempt++) {
    await waitForPageReady()

    try {
      results = await runAxeScan()
      break
    } catch (error) {
      if (!isPageFrameNotReadyError(error) || attempt === PAGE_READY_RETRIES) {
        throw error
      }

      await browser.pause(PAGE_READY_RETRY_DELAY_MS)
    }
  }

  if (results.violations.length > 0) {
    throw new Error(
      `Found ${results.violations.length} accessibility violation(s):\n\n` +
        formatViolations(results.violations)
    )
  }
}

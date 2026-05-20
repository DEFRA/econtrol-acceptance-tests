import AxeBuilder from '@axe-core/webdriverio'
import { browser } from '@wdio/globals'

const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

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

export const checkPageAccessibility = async () => {
  const results = await new AxeBuilder({ client: browser })
    .withTags(DEFAULT_TAGS)
    .analyze()

  if (results.violations.length > 0) {
    throw new Error(
      `Found ${results.violations.length} accessibility violation(s):\n\n` +
        formatViolations(results.violations)
    )
  }
}

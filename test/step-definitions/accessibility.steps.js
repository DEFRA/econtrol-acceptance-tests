import { Then } from '@wdio/cucumber-framework'
import { checkPageAccessibility } from '../utils/accessibility.js'

Then('the page should have no accessibility violations', async () => {
  await checkPageAccessibility()
})

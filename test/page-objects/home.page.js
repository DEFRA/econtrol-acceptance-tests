import { $ } from '@wdio/globals'
import { Page } from './page.js'

class HomePage extends Page {
  get mainHeading() {
    return $('h1')
  }

  open() {
    return super.open('/')
  }

  async clickLinkByText(text) {
    const link = await $(`a*=${text}`)
    await link.waitForClickable({ timeout: 10000 })
    await link.click()
  }

  async getHeadingText() {
    const heading = await $('h1')
    await heading.waitForDisplayed({ timeout: 10000 })
    return heading.getText()
  }
}

export { HomePage }

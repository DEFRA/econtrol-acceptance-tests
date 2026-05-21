import { browser, $ } from '@wdio/globals'

class Page {
  get pageHeading() {
    return $('h1')
  }

  open(path) {
    return browser.url(path)
  }

  get loginMicrosoftLink() {
    return $('//a[contains(.,"Login with Microsoft Account")]')
  }

  get emailInput() {
    return $('#i0116, input[type="email"]')
  }

  get passwordInput() {
    return $('#i0118, input[type="password"]')
  }

  get submitButton() {
    return $('#idSIButton9, input[type="submit"], button[type="submit"]')
  }

  get yesButton() {
    return $('//input[contains(@value,"Yes")]')
  }

  get continueButton() {
    return $('button[type="submit"], input[type="submit"], button*=Continue')
  }

  async isDisplayed(element) {
    try {
      return await element.isDisplayed()
    } catch {
      return false
    }
  }

  async enterPassword(password) {
    if (!password) {
      throw new Error('PASSWORD is not configured.')
    }

    await this.passwordInput.waitForDisplayed({ timeout: 10000 })
    await this.passwordInput.click()
    await this.passwordInput.setValue(password)
    await browser.waitUntil(
      async () => {
        const value = await this.passwordInput.getValue()
        return value.length > 0
      },
      {
        timeout: 5000,
        timeoutMsg: 'Password field was visible, but no value was entered.'
      }
    )
  }

  async clickContinue() {
    await this.continueButton.waitForClickable({ timeout: 10000 })
    await this.continueButton.click()
  }

  async login(email, password) {
    if (!email) {
      throw new Error('EMAIL is not configured.')
    }

    await this.loginMicrosoftLink.waitForClickable()
    await this.loginMicrosoftLink.click()

    await this.emailInput.waitForDisplayed()
    await this.emailInput.setValue(email)

    await this.submitButton.waitForClickable()
    await this.submitButton.click()

    await this.enterPassword(password)

    await this.submitButton.waitForClickable()
    await this.submitButton.click()

    await browser.waitUntil(
      async () =>
        (await this.isDisplayed(this.yesButton)) ||
        (await this.isDisplayed(this.pageHeading)),
      {
        timeout: 15000,
        timeoutMsg:
          'Expected either Microsoft stay-signed-in prompt or application page after login.'
      }
    )

    if (await this.isDisplayed(this.yesButton)) {
      await this.yesButton.click()
    }
  }
}

export { Page }

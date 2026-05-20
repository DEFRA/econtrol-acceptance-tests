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
    return $('input[type="email"]')
  }

  get passwordInput() {
    return $('input[type="password"]')
  }

  get submitButton() {
    return $('input[type="submit"], button[type="submit"]')
  }

  get yesButton() {
    return $('//input[contains(@value,"Yes")]')
  }

  async login(email, password) {
    await this.loginMicrosoftLink.waitForClickable()
    await this.loginMicrosoftLink.click()

    await this.emailInput.waitForDisplayed()
    await this.emailInput.setValue(email)

    await this.submitButton.waitForClickable()
    await this.submitButton.click()

    await this.passwordInput.waitForDisplayed()
    await this.passwordInput.setValue(password)

    await this.submitButton.waitForClickable()
    await this.submitButton.click()

    await this.yesButton.waitForClickable()
    await this.yesButton.click()
  }
}

export { Page }
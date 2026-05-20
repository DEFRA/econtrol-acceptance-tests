import { Given, When, Then } from '@wdio/cucumber-framework'
import { browser, expect } from '@wdio/globals'
import searchPermitPage from '../page-objects/searchPermit.page'

const email = process.env.EMAIL
const password = process.env.PASSWORD

Given(
  'I am logged in as an authorised Border Force officer',
  async () => {
    await searchPermitPage.open()
    await searchPermitPage.login(email, password)
  }
)

Given( 'I am on the Search Permit page', async () => {
  await searchPermitPage.open()
} )


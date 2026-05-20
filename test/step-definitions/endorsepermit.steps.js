import { Given } from '@wdio/cucumber-framework'
import searchPermitPage from '../page-objects/searchPermit.page'

const email = process.env.EMAIL
const password = process.env.PASSWORD

Given('I am logged in as an authorised Border Force officer', async () => {
  await searchPermitPage.ensureReady({ email, password })
})

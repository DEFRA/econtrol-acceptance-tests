# eControl Acceptance Tests

Acceptance test suite for the eControl CITES permit journey. The suite covers browser journeys, backend API checks, and accessibility checks using WebdriverIO, Cucumber, and Axe.

## Tech Stack

- Node.js `>=22.13.1`
- WebdriverIO v9
- Cucumber / Gherkin feature files
- Chrome local runner
- Axe via `@axe-core/webdriverio` for accessibility checks
- Allure reporting
- ESLint and Prettier for JavaScript formatting and linting
- Dotenv for environment-specific configuration

## Project Structure

```text
test/
  features/
    searchpermit.feature
    endorsepermit.feature
    accessibility.feature
    api/
      search-permit-api.feature
      endorse-permit-api.feature
  step-definitions/
    searchPermit.steps.js
    endorsepermit.steps.js
    apiPermit.steps.js
    accessibility.steps.js
  page-objects/
    page.js
    searchPermit.page.js
  utils/
    apiClient.js
    apiPermit.js
    apiAssertions.js
    accessibility.js
    tableAssertions.js
  config/
    apiRoutes.js
    loadEnv.js
```

## How Tests Are Written

Tests are written as Cucumber feature files. The feature files should describe the user or API behaviour in readable business language.

Test data is kept directly in the feature files. For example, permit numbers and expected table values are written in the Gherkin tables instead of being hidden behind aliases in a separate test data file. This makes it easier to update test inputs when permit data changes.

Step definitions should stay small. They should read values from the feature file, call a page object or utility, and make clear assertions.

Page objects contain browser interaction logic, such as opening the Search Permit page, entering permit numbers, clicking buttons, and reading table values.

Reusable assertion and parsing logic lives in `test/utils`. For example, `tableAssertions.js` is generic and can be reused by other pages that need to compare table rows from Cucumber examples.

## Test Types

### UI Journey Tests

UI tests use WebdriverIO with Chrome and Cucumber. They cover journeys such as searching for permits and checking the displayed results.

Main files:

- `test/features/searchpermit.feature`
- `test/features/endorsepermit.feature`
- `test/step-definitions/searchPermit.steps.js`
- `test/page-objects/searchPermit.page.js`

### API Tests

API tests call Dataverse-backed endpoints directly using `fetch` through the shared API client.

Main files:

- `test/features/api/search-permit-api.feature`
- `test/features/api/endorse-permit-api.feature`
- `test/step-definitions/apiPermit.steps.js`
- `test/utils/apiClient.js`
- `test/utils/apiPermit.js`
- `test/utils/apiAssertions.js`

API paths and Dataverse environment settings are resolved in `test/config/apiRoutes.js`.

### Accessibility Tests

Accessibility tests use `@axe-core/webdriverio`.

The accessibility scenario opens the Search Permit page and runs Axe against the current browser page:

```gherkin
@accessibility @ui
Feature: Accessibility

  Scenario: Search Permit page has no accessibility violations
    Then the page should have no accessibility violations
```

The implementation is in `test/utils/accessibility.js`. It checks the page using these Axe tags:

- `wcag2a`
- `wcag2aa`
- `wcag21a`
- `wcag21aa`

If violations are found, the test fails and prints the rule, impact, help URL, and affected nodes.

## Setup

Install dependencies:

```bash
npm install
```

Create an environment file for the environment you want to run against, for example:

```bash
.env.dev
.env.qa
```

Environment files are loaded by `test/config/loadEnv.js`. If `TEST_ENV` is not set, the default environment is `dev`.

Common environment variables:

```bash
TEST_ENV=dev
URL=https://your-ui-url
BASE_URL=https://your-ui-url
EMAIL=your-login-email
PASSWORD=your-login-password

DEV_DATAVERSE_BASE_URL=https://your-dev-dataverse-org.api.crm11.dynamics.com
DEV_DATAVERSE_CLIENT_ID=your-dev-client-id

TEST_DATAVERSE_BASE_URL=https://your-test-dataverse-org.api.crm11.dynamics.com
TEST_DATAVERSE_CLIENT_ID=your-test-client-id

API_TOKEN_VERSION=1
API_TOKEN_GRANT_TYPE=client_credentials
API_TOKEN_RESOURCE=https://your-dataverse-org.crm11.dynamics.com/
API_CLIENT_ID=your-api-client-id
API_CLIENT_SECRET=your-api-client-secret

# Optional: paste a manually generated token instead of generating one.
API_BEARER_TOKEN=

SEARCH_PERMIT_API_PATH=cites_SearchPermitByNumber
ENDORSE_PERMIT_API_PATH=cites_EndorsePermit
RETRIEVE_PERMIT_API_PATH=cites_SearchPermitByNumber
PERMIT_HISTORY_API_PATH=
```

Do not commit real tokens, passwords, or environment-specific secrets.

## GitHub Actions Secrets

Set these repository or environment secrets in GitHub before running the workflows.

Required for UI and accessibility tests:

- `URL`: eControl application URL.
- `EMAIL`: login email for the authorised test user.
- `PASSWORD`: login password for the authorised test user.
- `TEST_ENV`: target environment, usually `qa` or `dev`. The workflow defaults to `qa` if this is not set.

Required for API tests:

- `TEST_DATAVERSE_BASE_URL`: QA/test Dataverse base URL.
- `TEST_DATAVERSE_CLIENT_ID`: QA/test Dataverse client ID.
- `DEV_DATAVERSE_BASE_URL`: dev Dataverse base URL, required when running with `TEST_ENV=dev`.
- `DEV_DATAVERSE_CLIENT_ID`: dev Dataverse client ID, required when running with `TEST_ENV=dev`.

Authentication secrets. Use one of these approaches:

- Automatic token generation:
  - `API_TOKEN_VERSION`: usually `1` for Dataverse resource tokens.
  - `API_TOKEN_GRANT_TYPE`: set to `client_credentials`.
  - `API_TOKEN_RESOURCE`: Dataverse resource URL, for example `https://your-org.crm11.dynamics.com/`.
  - `API_CLIENT_ID`: app registration/client ID.
  - `API_CLIENT_SECRET`: app registration/client secret.
- Manual token fallback:
  - `API_BEARER_TOKEN`: paste a valid bearer token generated outside the test run.

Optional API route override secrets:

- `SEARCH_PERMIT_API_PATH`
- `ENDORSE_PERMIT_API_PATH`
- `RETRIEVE_PERMIT_API_PATH`
- `PERMIT_HISTORY_API_PATH`

Required API test data variables:

- `API_SEARCH_PERMIT_NUMBER`
- `ENDORSEMENT_PERMIT_ID`
- `ENDORSEMENT_PERMIT_NUMBER`

The feature files read these values from environment variables so the permit records can differ between environments.

## Running Tests

Run the default GitHub-style suite:

```bash
npm test
```

Run smoke tests:

```bash
npm run test:smoke
```

Run the endorse permit UI journey against dev:

```bash
npm run test:dev
```

Run the endorse permit UI journey against QA:

```bash
npm run test:qa
```

Run the Search Permit API test:

```bash
npm run test:api
```

Run API tests against dev:

```bash
npm run test:api:dev
```

Run API tests against QA:

```bash
npm run test:api:qa
```

Run accessibility tests:

```bash
npm run test:accessibility
```

Run all configured features headlessly:

```bash
npm run test:headless
```

You can also run a specific tag directly:

```bash
npm run clean && npx wdio run wdio.conf.js --cucumberOpts.tagExpression='@permit-search'
```

## Reports

Tests write Allure results to `allure-results`. The npm test scripts clean `allure-results` and `allure-report` before each run so the report only contains the scenarios from the latest test run.

If you run `npx wdio` directly, run `npm run clean` first. Otherwise Allure can include old scenarios from previous runs.

Generate the report:

```bash
npm run report
```

Open the report:

```bash
npm run report:open
```

Clean generated reports:

```bash
npm run clean
```

## Code Quality

Run linting:

```bash
npm run lint
```

Fix lint issues where possible:

```bash
npm run lint:fix
```

Format files:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## Conventions

- Keep readable test data in feature files.
- Keep step definitions thin.
- Put browser interactions in page objects.
- Put reusable assertions and shared logic in `test/utils`.
- Prefer generic utility names when the helper can be reused across pages.
- Use tags to keep suites easy to run, for example `@smoke`, `@api`, `@accessibility`, and journey-specific tags.
- Do not commit secrets or local tokens.

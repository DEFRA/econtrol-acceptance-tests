import { browser, $ } from '@wdio/globals'

export const config = {
    runner: 'local',

    specs: ['./test/features/**/*.feature'],
    exclude: [],

    maxInstances: 1,

    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: process.env.HEADLESS === 'true'
                ? ['--headless=new', '--disable-gpu', '--window-size=1280,800', '--no-sandbox']
                : ['--window-size=1280,800']
        }
    }],

    logLevel: 'info',
    bail: 0,
    baseUrl: 'https://e-cites-control-prototype-56981975969e.herokuapp.com/',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    framework: 'cucumber',

    reporters: [
        'spec',
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false,
            useCucumberStepReporter: true
        }]
    ],

    cucumberOpts: {
        require: ['./test/step-definitions/**/*.js'],
        timeout: 60000,
    },


    afterStep: async function (step, scenario, { error }) {
        if (error) {
            await browser.takeScreenshot();
        }
    }
};

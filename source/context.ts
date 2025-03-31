import {BrowserContext, chromium} from "playwright";
import fs from "fs";

const getContext = async (metamaskPath) => {
    if (!fs.existsSync(metamaskPath)) {
        throw new Error('❌ MetaMask extension not found at ./metamask-extension');
    }

    const context: BrowserContext = await chromium.launchPersistentContext('', {
        headless: false,
        args: [
            `--disable-extensions-except=${metamaskPath}`,
            `--load-extension=${metamaskPath}`,
            '--start-maximized',
        ],
    });


    context.setDefaultTimeout(200000);

    return context;
}

export {getContext}
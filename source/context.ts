import { BrowserContext, chromium } from 'playwright';
import fs from 'fs';
import { TEST_FAIL_TIMEOUT } from './const';
import os from 'os';
import path from 'path';

const getContext = async (metamaskPath: string) => {
    if (!fs.existsSync(metamaskPath)) {
        throw new Error(
            '❌ MetaMask extension not found at ./metamask-extension'
        );
    }
    const tempProfileDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'pw-profile-')
    );

    const context: BrowserContext = await chromium.launchPersistentContext(
        tempProfileDir,
        {
            headless: false,
            args: [
                `--disable-extensions-except=${metamaskPath}`,
                `--load-extension=${metamaskPath}`,
                '--start-maximized',
            ],
        }
    );

    context.setDefaultTimeout(TEST_FAIL_TIMEOUT);

    return context;
};

export { getContext };

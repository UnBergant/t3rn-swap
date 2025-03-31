import { BrowserContext, Page } from 'playwright';
import {
    getFullSelector,
    SELECTOR_TYPES,
    wait,
    waitAndClick,
} from './utils/page';

enum NETWORKS {
    ARB = 'Arbitrum Sepolia',
    BASE = 'Base Sepolia',
    OP = 'OP Sepolia',
    UNI = 'Unichain Sepolia',
}

const closeTestnetPopup = async (page: Page) => {
    await page
        .locator(
            getFullSelector({
                selector: 'Accept',
                type: SELECTOR_TYPES.BUTTON_TEXT,
            })
        )
        .click();
};

const openSwapPage = async (context: BrowserContext) => {
    const page = await context.newPage();
    await page.goto('https://unlock3d.t3rn.io/');
    console.log('🌐 Открыта страница unlock3d.t3rn.io');
    return page;
};

type SetNetwork = {
    networks: { source: NETWORKS; target: NETWORKS };
    context: BrowserContext;
    page: Page;
};

const setNetworks = async ({
    context,
    networks: { source, target },
    page,
}: SetNetwork) => {
    await page
        .locator(
            getFullSelector({
                selector: 'ui-select-network-and-asset',
                type: SELECTOR_TYPES.DATA_TEST_ID,
            })
        )
        .first()
        .click();
    await page
        .locator(
            getFullSelector({ selector: source, type: SELECTOR_TYPES.TEXT })
        )
        .click();
    console.log(`🌐 Source network ${source} set`);

    await page
        .locator(
            getFullSelector({
                selector: 'ui-select-network-and-asset',
                type: SELECTOR_TYPES.DATA_TEST_ID,
            })
        )
        .nth(2)
        .click();
    await page
        .locator(
            getFullSelector({ selector: target, type: SELECTOR_TYPES.TEXT })
        )
        .click();

    console.log(`🌐 Target network ${target} set`);
};

const connectMetamask = async (context: BrowserContext, page: Page) => {
    await waitAndClick({
        selector: 'ui-connect-wallet',
        type: SELECTOR_TYPES.DATA_TEST_ID,
        page,
    });
    await waitAndClick({
        selector: 'MetaMask',
        type: SELECTOR_TYPES.TEXT,
        page,
    });
    const popup = await context.waitForEvent('page');
    await popup.waitForLoadState();
    await popup.bringToFront();
    await waitAndClick({
        selector: 'Connect',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
};

const approveNetwork = async (context: BrowserContext) => {
    const popup = await context.waitForEvent('page');
    await popup.waitForLoadState();
    await popup.bringToFront();
    await waitAndClick({
        selector: 'confirmation-submit-button',
        type: SELECTOR_TYPES.DATA_TEST_ID,
        page: popup,
    });
};

const confirmMetamask = async (context: BrowserContext) => {
    const popup = await context.waitForEvent('page');
    await popup.waitForLoadState();
    await popup.bringToFront();
    await waitAndClick({
        selector: 'Confirm',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
};

const connectNetwork = async (page: Page) => {
    await waitAndClick({
        selector: 'Connect to',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page,
    });
};

interface ISwap {
    page: Page;
    settings: { amount: number; chain: { source: NETWORKS; target: NETWORKS } };
    context: BrowserContext;
}

const swap = async ({
    page,
    settings: {
        amount,
        chain: { source, target },
    },
    context,
}: ISwap) => {
    await page.bringToFront();
    const swapAmountInput = getFullSelector({
        selector: 'ui-max-reward-input',
        type: SELECTOR_TYPES.DATA_TEST_ID,
    });

    await wait({
        selector: 'ui-max-reward-input',
        type: SELECTOR_TYPES.DATA_TEST_ID,
        page,
    });

    const amountInput = page.locator(swapAmountInput);
    await amountInput.fill(`${amount}`);
    const swapButton = page.locator('button', {
        hasText: 'Confirm transaction',
    });
    await swapButton.waitFor({ state: 'visible' });
    await swapButton.click();
    await confirmMetamask(context);
    await page.bringToFront();

    await waitAndClick({
        selector: 'Submit a new Order',
        type: SELECTOR_TYPES.TEXT,
        page,
    });
    console.log(`✅ Swap ${amount} ETH ${source} -> ${target} обработан`);
};

export {
    openSwapPage,
    setNetworks,
    closeTestnetPopup,
    connectMetamask,
    connectNetwork,
    approveNetwork,
    swap,
    NETWORKS,
};

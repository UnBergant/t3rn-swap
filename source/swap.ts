import { BrowserContext, Page } from 'playwright';
import { getFullSelector, wait, waitAndClick } from './utils/page';
import {
    ORDER_RESOLVE_STATUS,
    SELECTOR_TYPES,
    WAIT_FOR_ELEMENT_TIMEOUT,
} from './const';
import {
    cancelablePromisify,
    countdown,
    createEmptyLog,
    getBalance,
} from './utils';
import {
    goBackButtonSelector,
    submitNewOrderButtonSelector,
    swapAmountInput,
} from './elements/selectors';

enum NETWORKS {
    ARB = 'Arbitrum Sepolia',
    BASE = 'Base Sepolia',
    BLST = 'Blast Sepolia',
    B2N = 'B2N',
    OP = 'OP Sepolia',
    UNI = 'Unichain Sepolia',
    MONT = 'Monad Testnet',
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
    // console.log('🌐 Открыта страница unlock3d.t3rn.io');
    return page;
};

type SetNetwork = {
    networks: { source: NETWORKS; target: NETWORKS };
    page: Page;
};

const setNetworks = async ({
    networks: { source, target },
    page,
}: SetNetwork) => {
    await wait({
        selector: 'ui-select-network-and-asset',
        type: SELECTOR_TYPES.DATA_TEST_ID,
        page,
    });
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
    console.log(`🌐✅ Swap ${source} -> ${target} networks set`);
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
    //await popup.bringToFront();
    await waitAndClick({
        selector: 'Connect',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
};

const approveNetwork = async (context: BrowserContext) => {
    // console.log('🌐 Approve network');

    try {
        const popup = await context.waitForEvent('page', { timeout: 10000 });
        await popup.waitForLoadState();
        await waitAndClick({
            selector: 'confirmation-submit-button',
            type: SELECTOR_TYPES.DATA_TEST_ID,
            page: popup,
        });
    } catch {
        // console.log('Network already approved');
        return;
    }
};

async function closeIfSpinnerHangs(metaMaskPage: Page, timeoutMs = 5000) {
    if (!metaMaskPage) {
        // console.log('MetaMask окно не найдено');
        return;
    }

    try {
        const spinner = metaMaskPage.locator('.lds-spinner');

        const isVisible = await spinner
            .isVisible({ timeout: 1000 })
            .catch(() => false);

        if (isVisible) {
            // console.log('⏳ Спиннер найден, ждём исчезновения...');
            await spinner.waitFor({ state: 'hidden', timeout: timeoutMs });
            // console.log('✅ Спиннер исчез — всё ок');
        }
    } catch (e) {
        console.warn(
            `⚠️ Спиннер не исчез за ${timeoutMs}мс — закрываем окно...`
        );
        await metaMaskPage.close();
    }
}

const confirmMetamask = async (context: BrowserContext) => {
    const popup = await context.waitForEvent('page');
    await popup.waitForLoadState();
    await popup.bringToFront();
    // await closeIfSpinnerHangs(popup, 2000);
    // console.log('🦊 Looking for confirm button 👀');
    await waitAndClick({
        selector: 'Confirm',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
};

const cancelOnAlertMetamask = async (context: BrowserContext) => {
    const popup = await context.waitForEvent('page');
    await popup.waitForLoadState();
    // await popup.bringToFront();
    const { promise, cancel } = cancelablePromisify(
        cancelMultipleRequestAlert,
        popup
    );

    promise.catch(() => {});
    await wait({
        selector: 'Alert',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
    // console.log('⚠️⛽️ Gas alert');

    setTimeout(() => {
        cancel();
    }, 3000);
    await waitAndClick({
        selector: 'Cancel',
        type: SELECTOR_TYPES.BUTTON_TEXT,
        page: popup,
    });
    // console.log('❌ Cancel Metamask');
};

const cancelMultipleRequestAlert = async (page: Page) => {
    const alertPopupSelector = getFullSelector({
        selector: "We've noticed multiple requests",
        type: SELECTOR_TYPES.TEXT,
    });
    try {
        // console.log('🦧 Multiple requests popup check');
        const alertIsVisible = await page
            .locator(alertPopupSelector)
            .isVisible();
        if (alertIsVisible) {
            // console.log('🦧 Multiple requests popup detected');
            const alertPopupCancelButton = page.locator(
                '[role="dialog"] >> text=Cancel'
            );
            await alertPopupCancelButton.click();

            // console.log('🦧 Multiple requests popup closed');
            return { ok: true, body: {} };
        }
    } catch {
        // console.log('Context is closed');
    }

    return { ok: false, body: {} };
};

const connectNetwork = async (page: Page) => {
    // console.log('🌐 Connect network');
    const fullSelector = getFullSelector({
        selector: 'Connect to',
        type: SELECTOR_TYPES.BUTTON_TEXT,
    });
    try {
        await page.waitForSelector(fullSelector, { timeout: 10000 });
    } catch {
        // console.log('🌐 Network already connected');
        return;
    }
    await page.click(fullSelector);
};

export interface ILogs {
    swaps: {
        stats: {
            source: NETWORKS;
            target: NETWORKS;
            timeout: number;
            success: number;
            failed: number;
            time: number;
            balance: string;
        }[];
    };
    globalErrors: {
        errors: Error[];
    };
}

interface ISwap {
    page: Page;
    settings: { amount: number; chain: { source: NETWORKS; target: NETWORKS } };
    context: BrowserContext;
    logs: ILogs;
}

const swap = async ({
    page,
    settings: {
        amount,
        chain: { source, target },
    },
    context,
    logs,
}: ISwap) => {
    let logStatsIdx = logs.swaps.stats.findIndex(
        (el) => el.source === source && el.target === target
    );
    if (logStatsIdx === -1) {
        logs.swaps.stats.push(createEmptyLog({ source, target }));
        logStatsIdx = logs.swaps.stats.length - 1;
    }

    const currentLog = logs.swaps.stats[logStatsIdx];

    currentLog.balance = await getBalance(page);

    await wait({
        selector: 'ui-max-reward-input',
        type: SELECTOR_TYPES.DATA_TEST_ID,
        page,
    });

    const amountInput = page.locator(swapAmountInput);
    const swapButton = page.locator('button', {
        hasText: 'Confirm transaction',
    });
    const insufficientBalanceButton = page.locator('button', {
        hasText: 'Insufficient balance',
    });

    const goBackButton = page.locator(goBackButtonSelector);

    const submitNewOrder = page.locator(submitNewOrderButtonSelector);

    await amountInput.fill(`${amount}`);

    try {
        await new Promise((resolve, reject) => {
            const interval = setInterval(
                () =>
                    (async () => {
                        // console.log('👀 Check swap/Insufficient balance button');
                        try {
                            if (
                                await insufficientBalanceButton.isVisible({
                                    timeout: WAIT_FOR_ELEMENT_TIMEOUT,
                                })
                            ) {
                                // console.log('Insufficient balance button visible');
                                clearInterval(interval);
                                return reject('Insufficient balance');
                            } else if (
                                await swapButton.isVisible({
                                    timeout: WAIT_FOR_ELEMENT_TIMEOUT,
                                })
                            ) {
                                // console.log('🔁 Swap button is visible');
                                await swapButton.click();
                                // console.log('🔁 Confirm transaction button i s not visible');
                            } else {
                                return;
                            }
                        } catch (e) {
                            console.error(e);
                            console.log('🔁 Swap button is err');
                            clearInterval(interval);
                            return reject(e);
                        }

                        clearInterval(interval);
                        return resolve(null);
                    })(),
                1000
            );
        });
    } catch (e) {
        console.log('🦊 Confirm transaction button not visible');
        throw new Error(e);
    }
    console.log(
        `🦊 Swap: ${amount} ETH | ${source} -> ${target} ✍️ (waiting for sign)`
    );

    await confirmMetamask(context);
    // const cPromise = cancelOnAlertMetamask(context);

    console.log(
        `🦊 Swap: ${amount} ETH | ${source} -> ${target} ✍️ (signed by Metamask)`
    );

    await new Promise((resolve, reject) => {
        let timeoutId = null;
        const timeout = 5000;
        let tick = timeout / 1000;

        const interval = setInterval(async () => {
            timeoutId =
                timeoutId ||
                setTimeout(async () => {
                    try {
                        clearInterval(interval);
                        // console.log('⌛ Expired confirmation timeout');
                        currentLog.timeout++;
                        // console.log('🚶 Go to main page');
                        await page.goto('https://unlock3d.t3rn.io/', {
                            timeout: WAIT_FOR_ELEMENT_TIMEOUT * 2,
                        });
                        resolve(ORDER_RESOLVE_STATUS.timeout);
                    } catch (e) {
                        console.log({ e });
                        return reject(e);
                    }
                }, timeout);

            console.log(`📟 Transaction signed confirmation 🕰 ${tick}...`);
            tick--;
            try {
                if (
                    await goBackButton.isVisible({
                        timeout: WAIT_FOR_ELEMENT_TIMEOUT,
                    })
                ) {
                    await goBackButton.click();
                    currentLog.failed++;
                    console.log(
                        `🔁 Swap: ${amount} ETH | ${source} -> ${target} ❌  (failed)`
                    );
                } else if (
                    await submitNewOrder.isVisible({
                        timeout: WAIT_FOR_ELEMENT_TIMEOUT,
                    })
                ) {
                    await submitNewOrder.click();
                    currentLog.success++;
                    console.log(
                        `🔁 Swap: ${amount} ETH | ${source} -> ${target} ✅  (filed)`
                    );
                } else {
                    return;
                }
            } catch (e) {
                console.error(e);
                `🔁 Swap: ${amount} ETH | ${source} -> ${target} ❌  (failed)`;
            }

            clearTimeout(timeoutId);
            clearInterval(interval);
            resolve(ORDER_RESOLVE_STATUS.success);
        }, 1000);
    });
};

const swapChains = async ({ context, page, networks }) => {
    await setNetworks({
        page,
        networks,
    });
    await connectNetwork(page);
    await approveNetwork(context);
};

export {
    openSwapPage,
    setNetworks,
    closeTestnetPopup,
    connectMetamask,
    connectNetwork,
    approveNetwork,
    swap,
    swapChains,
    NETWORKS,
};

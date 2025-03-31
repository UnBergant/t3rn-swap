import { BrowserContext } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.SECRET_KEY;
const password = process.env.PASSWORD;

const customNetwork = {
    name: 'Base Sepolia Testnet',
    rpc: 'https://sepolia.base.org',
    chainId: '84532',
    symbol: 'ETH',
    explorer: 'https://sepolia.basescan.org',
};

enum SELECTOR_TYPES {
    DATA_TEST_ID = 'dataTestId',
    BUTTON_TEXT = 'buttonText',
    TEXT = 'text',
    INPUT_PLACEHOLDER = 'inputPlaceholder',
}

const installMetamask = async (context: BrowserContext) => {
    // Элегантно ждём появления нужной страницы MetaMask
    const metamaskPage = await context.waitForEvent('page', async (page) => {
        await page.waitForLoadState();
        return (await page.title()).includes('MetaMask');
    });

    const waitAndClick = async ({
        selector,
        type = SELECTOR_TYPES.DATA_TEST_ID,
    }) => {
        await wait({ selector, type });
        await click({ selector, type });
    };

    const getFullSelector = ({
        selector,
        type,
    }: {
        selector: string;
        type: SELECTOR_TYPES;
    }) => {
        let fullSelector = '';
        switch (type) {
            case SELECTOR_TYPES.INPUT_PLACEHOLDER:
                fullSelector = `input[placeholder="${selector}"]`;
                break;
            case SELECTOR_TYPES.TEXT:
                fullSelector = `text="${selector}"`;
                break;
            case SELECTOR_TYPES.BUTTON_TEXT:
                fullSelector = `button:has-text("${selector}")`;
                break;
            case SELECTOR_TYPES.DATA_TEST_ID:
            default:
                fullSelector = `[data-testid="${selector}"]`;
        }

        return fullSelector;
    };

    const wait = async ({
        selector,
        type,
    }: {
        selector: string;
        type: SELECTOR_TYPES;
    }) => {
        const fullSelector = getFullSelector({ selector, type });
        await metamaskPage.waitForSelector(fullSelector);
    };

    const click = async ({
        selector,
        type,
    }: {
        selector: string;
        type: SELECTOR_TYPES;
    }) => {
        const fullSelector = getFullSelector({ selector, type });
        await metamaskPage.click(fullSelector);
    };

    console.log('🚀 MetaMask открыт. Ждём загрузку...');

    await metamaskPage.waitForSelector('#onboarding__terms-checkbox');
    await metamaskPage.click('#onboarding__terms-checkbox');
    await metamaskPage.click('text=Create a new wallet');
    await metamaskPage.click('text=No thanks'); // Пропустить метамаск метрики, если есть
    await metamaskPage.fill('[data-testid="create-password-new"]', password);
    await metamaskPage.fill(
        '[data-testid="create-password-confirm"]',
        password
    );
    await metamaskPage.click('[data-testid="create-password-terms"]');
    await metamaskPage.click('[data-testid="create-password-wallet"]');

    await metamaskPage.waitForSelector('[data-testid="secure-wallet-later"]');
    await metamaskPage.click('[data-testid="secure-wallet-later"]');
    await metamaskPage.click(
        '[data-testid="skip-srp-backup-popover-checkbox"]'
    );
    await metamaskPage.click('[data-testid="skip-srp-backup"]');

    await metamaskPage.waitForSelector(
        '[data-testid="onboarding-complete-done"]'
    );

    await metamaskPage.click('[data-testid="onboarding-complete-done"]');

    await metamaskPage.waitForSelector('button:has-text("Next")');
    await metamaskPage.click('button:has-text("Next")');

    await metamaskPage.waitForSelector('button:has-text("Done")');
    await metamaskPage.click('button:has-text("Done")');

    console.log(
        '✅ Новый кошелёк создан. Импортируем аккаунт по приватному ключу...'
    );

    await metamaskPage.click('button:has-text("Account")');

    await metamaskPage.waitForSelector(
        '[data-testid="multichain-account-menu-popover-action-button"]'
    );
    await metamaskPage.click(
        '[data-testid="multichain-account-menu-popover-action-button"]'
    );

    await metamaskPage.waitForSelector(
        '[data-testid="multichain-account-menu-popover-add-imported-account"]'
    );
    await metamaskPage.waitForSelector('[data-testid="network-display"]');
    await metamaskPage.click(
        '[data-testid="multichain-account-menu-popover-add-imported-account"]'
    );

    await metamaskPage.waitForSelector('#private-key-box');
    const privateKeyInput = await metamaskPage.$('input');
    await privateKeyInput?.fill(secretKey);
    await metamaskPage.click('button:has-text("Import")');

    console.log('✅ Аккаунт импортирован. Добавляем кастомную сеть...');

    await metamaskPage.click('button:has-text("Network")');

    await waitAndClick({
        selector: 'network-display',
        type: SELECTOR_TYPES.DATA_TEST_ID,
    });
    await waitAndClick({
        selector: 'Add a custom network',
        type: SELECTOR_TYPES.BUTTON_TEXT,
    });
    await metamaskPage.waitForSelector(
        '[data-testid="network-form-name-input"]'
    );

    await waitAndClick({
        selector: 'network-form-network-name',
        type: SELECTOR_TYPES.DATA_TEST_ID,
    });

    await waitAndClick({
        selector: 'test-add-rpc-drop-down',
        type: SELECTOR_TYPES.DATA_TEST_ID,
    });
    await waitAndClick({
        selector: 'Add RPC URL',
        type: SELECTOR_TYPES.BUTTON_TEXT,
    });
    await waitAndClick({
        selector: 'rpc-url-input-test',
        type: SELECTOR_TYPES.DATA_TEST_ID,
    });
    const RPC_DATA = await metamaskPage.$('input');
    await RPC_DATA.fill(customNetwork.rpc);
    await waitAndClick({
        selector: 'Add URL',
        type: SELECTOR_TYPES.BUTTON_TEXT,
    });

    await wait({ selector: 'Add a custom network', type: SELECTOR_TYPES.TEXT });

    const networkInputs = await metamaskPage.$$('input');
    await networkInputs[0].fill(customNetwork.name);
    await networkInputs[1].fill(customNetwork.chainId);
    await networkInputs[2].fill(customNetwork.symbol);

    await waitAndClick({ selector: 'Save', type: SELECTOR_TYPES.BUTTON_TEXT });

    console.log(`✅ Сеть "${customNetwork.name}" добавлена и активирована.`);
};

export default installMetamask;

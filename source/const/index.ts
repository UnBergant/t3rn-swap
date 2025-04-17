import dotenv from 'dotenv';
dotenv.config();
const CUSTOM_RPC = process.env.CUSTOM_RPC;

// Теперь можно использовать:
console.log(process.env.API_KEY); // 12345

const TIMEOUT_INTERVAL = 500;
const TEST_FAIL_TIMEOUT = 35000;
enum MODE {
    twoDirections = 'twoDirections',
    oneDirection = 'oneDirection',
}

enum SELECTOR_TYPES {
    DATA_TEST_ID = 'dataTestId',
    BUTTON_TEXT = 'buttonText',
    TEXT = 'text',
    INPUT_PLACEHOLDER = 'inputPlaceholder',
}

const customNetwork = {
    name: 'Unichain Sepolia Testnet',
    rpc: 'https://unichain-sepolia.drpc.org',
    chainId: '1301',
    symbol: 'ETH',
    explorer: 'https://sepolia.basescan.org',
};

const ORDER_RESOLVE_STATUS = {
    success: 'success',
    fail: 'fail',
    timeout: 'timeout',
};

export {
    TIMEOUT_INTERVAL,
    TEST_FAIL_TIMEOUT,
    ORDER_RESOLVE_STATUS,
    MODE,
    SELECTOR_TYPES,
    customNetwork,
};

export const WAIT_FOR_ELEMENT_TIMEOUT = 10000;
export const SEC = 1000;
export const MIN = 60 * SEC;

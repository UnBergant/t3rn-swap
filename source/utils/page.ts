import {Page} from "playwright";

enum SELECTOR_TYPES {
    DATA_TEST_ID = 'dataTestId',
    BUTTON_TEXT = 'buttonText',
    TEXT = 'text',
    INPUT_PLACEHOLDER = 'inputPlaceholder',
}


const waitAndClick = async ({selector, type = SELECTOR_TYPES.DATA_TEST_ID, page}) => {
    await wait({selector, type, page});
    await click({selector, type, page});
}

const getFullSelector = ({selector, type}: {selector: string, type: SELECTOR_TYPES}) => {
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
}

const wait = async ({selector, type, page}: {selector: string, type: SELECTOR_TYPES, page: Page}) => {
    const fullSelector = getFullSelector({selector, type});
    await page.waitForSelector(fullSelector);
};

const click = async ({selector, type, page}: {selector: string, type: SELECTOR_TYPES, page: Page}) => {
    const fullSelector = getFullSelector({selector, type});
    await page.click(fullSelector);
}

export {waitAndClick, click, wait, getFullSelector, SELECTOR_TYPES};
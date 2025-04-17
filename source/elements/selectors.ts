import { getFullSelector } from '../utils/page';
import { SELECTOR_TYPES } from '../const';

const swapAmountInput = getFullSelector({
    selector: 'ui-max-reward-input',
    type: SELECTOR_TYPES.DATA_TEST_ID,
});

const goBackButtonSelector = getFullSelector({
    selector: 'Go Back',
    type: SELECTOR_TYPES.BUTTON_TEXT,
});

const submitNewOrderButtonSelector = getFullSelector({
    selector: 'Submit a new Order',
    type: SELECTOR_TYPES.TEXT,
});

export { swapAmountInput, goBackButtonSelector, submitNewOrderButtonSelector };

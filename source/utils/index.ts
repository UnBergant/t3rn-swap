import { SELECTOR_TYPES, TIMEOUT_INTERVAL } from '../const';
import { ILogs, NETWORKS } from '../swap';
import { getFullSelector } from './page';
import { Page } from 'playwright';

const promisify = (f, ...args: any[]) => {
    return new Promise((res, rej) => {
        let attemptNumber = 1;
        const intervalId = setInterval(() => {
            const result = f(...args);
            console.log(`attemp ${attemptNumber}`);
            if (result) {
                // console.log('success: resolve');
                clearInterval(intervalId);
                res(result);
            }
            attemptNumber++;
        }, TIMEOUT_INTERVAL);
    });
};

function formatMsToMinutes(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const countdown = (remaining: number, tick = 1000, description = '') => {
    const interval = setInterval(() => {
        remaining -= tick;
        const timeStr = formatMsToMinutes(remaining);
        console.log(`⏳ Time left: ${timeStr} (${description})`);

        if (remaining <= 0) {
            clearInterval(interval);
            console.log(`⏳ Countdown complete! (${description}) ✅`);
        }
    }, tick);
};

interface CancelablePromisifyFunction {
    (...args: any[]): Promise<{ ok: Boolean; body: any }>;
}

const cancelablePromisify = (
    f: CancelablePromisifyFunction,
    ...args: any[]
) => {
    let isCanceled: boolean = false;
    let timeoutId: NodeJS.Timeout;

    const promise = new Promise((res, rej) => {
        const check = async () => {
            const result = await f(...args);
            switch (true) {
                case result.ok:
                    res(result.body);
                    break;
                case isCanceled:
                    rej({ isCanceled });
                    break;
                default:
                    timeoutId = setTimeout(check, 500);
                    return;
            }
        };
        check();
    });

    return {
        promise,
        cancel: () => {
            isCanceled = true;
            clearTimeout(timeoutId);
        },
    };
};

const printLogs = (logs: ILogs) => {
    logs.swaps.stats.forEach((stat, index) => {
        console.log(`-------------------------`);
        console.log(`📊 Swap #${index + 1}`);
        console.log(`   🔁 ${stat.source} → ${stat.target}`);
        console.log(`   💰 Balance: ${Number(stat.balance).toFixed(2)} ETH`);
        console.log(`   ⏱️ Timeout: ${stat.timeout}`);
        console.log(`   ✅  Success: ${stat.success}`);
        console.log(`   ❌  Failed: ${stat.failed}`);
        console.log(`   🛑 Global errors: ${logs.globalErrors.errors.length}`);
        if (logs.swaps.stats.length) {
            const ms = Date.now() - logs.swaps.stats[0].time;
            const min = Math.floor(ms / 60000);
            const sec = Math.floor((ms % 60000) / 1000);
            console.log(
                `   ⏳  Runtime: ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
            );
        }
        // console.log('-------------------------');
    });
};

const printInsufficientBalanceError = () => {
    console.log(`
===============================
❌  INSUFFICIENT BALANCE
💡  Swap skipped due to low funds
===============================
`);
};

const getBalance = async (page: Page) => {
    const balance = page
        .getByText('Balance') // ищем текст "Balance"
        .locator('..') // переходим к родительскому <div>
        .locator('span.decoration-dotted');

    await balance.isVisible();
    return await balance.textContent();
};

const createEmptyLog = ({
    source,
    target,
}: {
    source: NETWORKS;
    target: NETWORKS;
}) => {
    return {
        source,
        target,
        timeout: 0,
        failed: 0,
        success: 0,
        time: Date.now(),
        balance: '',
    };
};

export {
    countdown,
    cancelablePromisify,
    printLogs,
    printInsufficientBalanceError,
    getBalance,
    createEmptyLog,
};

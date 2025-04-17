import installMetamask from './install-metamask';
import path from 'path';
import { getContext } from './context';
import {
    approveNetwork,
    closeTestnetPopup,
    connectMetamask,
    connectNetwork,
    ILogs,
    NETWORKS,
    openSwapPage,
    setNetworks,
    swap,
    swapChains,
} from './swap';
import { MIN, MODE } from './const';
import { countdown, printInsufficientBalanceError, printLogs } from './utils';
import { BrowserContext } from 'playwright';

const metamaskPath = path.join(__dirname, '../metamask-extension');

interface Config {
    networks: {
        source: NETWORKS;
        target: NETWORKS;
    };
    amount: number;
    mode: MODE;
    swapTimeout: number;
    countdownInterval: number;
}

let CONF: Config = {
    networks: {
        source: NETWORKS.BASE,
        target: NETWORKS.OP,
    },
    amount: 1,
    mode: MODE.twoDirections,
    swapTimeout: 8 * MIN,
    countdownInterval: 30000,
};

function isEvenGroup(n: number): boolean {
    return Math.floor(n / 2) % 2 === 0;
}

const getNewPairsOfNetwork = (pair: number) => {
    const networks = [
        [NETWORKS.BASE, NETWORKS.BLST],
        [NETWORKS.BASE, NETWORKS.BLST],
        // [NETWORKS.BASE, NETWORKS.OP],
    ];

    return networks[pair];
};
const getNewNetwork = (idx: number) => {
    const pair = isEvenGroup(idx) ? 0 : 1;
    const networks = getNewPairsOfNetwork(pair);
    const [sourceNIdx, targetNIdx] = idx % 2 === 0 ? [0, 1] : [1, 0];

    return {
        source: networks[sourceNIdx],
        target: networks[targetNIdx],
    };
};

let logs: ILogs = {
    swaps: {
        stats: [],
    },
    globalErrors: {
        errors: [],
    },
};

let context: BrowserContext;

const main = async () => {
    try {
        let idx = 0;

        context = await getContext(metamaskPath);
        await installMetamask(context);
        const page = await openSwapPage(context);
        await closeTestnetPopup(page);
        await connectMetamask(context, page);
        const conf = { ...CONF };
        conf.networks = getNewNetwork(idx);
        await setNetworks({
            page,
            networks: conf.networks,
        });
        await connectNetwork(page);

        await approveNetwork(context);
        // await page.waitForTimeout(5000);

        const makeSwap = async (conf) => {
            console.log(
                `🔁 Swap: ${conf.amount} ETH | ${conf.networks.source} → ${conf.networks.target} 👨‍🍳(preparing)`
            );

            try {
                await swap({
                    page,
                    settings: {
                        amount: conf.amount,
                        chain: {
                            source: conf.networks.source,
                            target: conf.networks.target,
                        },
                    },
                    context,
                    logs,
                });

                printLogs(logs);
            } catch (e) {
                // Insufficient balance
                console.log(`${e}`);
                printInsufficientBalanceError();
                idx++;

                const networks = getNewNetwork(idx);
                conf.networks = networks;
                console.log(
                    `🔁 Swapping chains: ${networks.source} → ${networks.target}`
                );
                await swapChains({ context, page, networks });
                console.log('✅ Swap finished');
            }
        };

        while (true) {
            await makeSwap(conf);
        }
    } catch (e) {
        console.log('😬 Global error');
        console.log(e);
        logs.globalErrors.errors.push(e);
    } finally {
        console.log('🏁 Global finally block');
        try {
            await context.close(); // kill chrome instance if something went wrong
        } catch (e) {
            console.log('🏁 Context is already closed');
        }
        await main();
    }
};

main();

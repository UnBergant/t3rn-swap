import installMetamask from './install-metamask';
import path from 'path';
import { getContext } from './context';
import {
    approveNetwork,
    closeTestnetPopup,
    connectMetamask,
    connectNetwork,
    NETWORKS,
    openSwapPage,
    setNetworks,
    swap,
} from './swap';
import { Protocol } from 'playwright-core/types/protocol';
import Page = Protocol.Page;

const metamaskPath = path.join(__dirname, '../metamask-extension');

(async () => {
    let CONF = {
        network: {
            source: NETWORKS.ARB,
            target: NETWORKS.BASE,
        },
        amount: 5,
    };
    const context = await getContext(metamaskPath);
    await installMetamask(context);
    const page = await openSwapPage(context);
    await closeTestnetPopup(page);
    await connectMetamask(context, page);
    await setNetworks({
        context,
        page,
        networks: { source: CONF.network.source, target: CONF.network.target },
    });
    await connectNetwork(page);

    await approveNetwork(context);

    const makeSwap = async () => {
        await swap({
            page,
            settings: {
                amount: CONF.amount,
                chain: {
                    source: CONF.network.source,
                    target: CONF.network.target,
                },
            },
            context,
        });
        await makeSwap();
    };
    await makeSwap();
})();

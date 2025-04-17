# 🔁 T3rn Swap Automation Bot

Automated token swapping across testnets using [t3rn.io](https://unlock3d.t3rn.io) bridge UI with MetaMask and Playwright.

This bot installs MetaMask in a Chromium browser, imports your wallet, adds supported testnets (e.g., Base Sepolia), and executes swaps via [unlock3d.t3rn.io](https://unlock3d.t3rn.io).

---

## 🚀 Features

- Auto-launch Chromium with MetaMask extension
- Import wallet using private key
- Add custom test networks (e.g., Base Sepolia)
- Navigate to the T3rn bridge interface
- Select source/destination networks and tokens
- Fill in swap amount
- Confirm transactions using MetaMask popup
- Supports retry and error handling

---

## 🛠 Prerequisites

- Node.js >= 18
- [MetaMask extension ZIP](https://github.com/MetaMask/metamask-extension/releases)

---

## 📦 Installation

```bash
git clone https://github.com/yourname/t3rn-swap-bot.git
cd t3rn-swap-bot
npm install
```

Unpack the MetaMask ZIP into the folder:

```
./metamask-extension
```

---

## ⚙️ Configuration

Open `install-metamask.ts` and set:

```ts
const secretKey = '0x...';       // your private key
const password = 'password123';  // password to protect MetaMask
```

(Optional) Change network config:

```ts
const customNetwork = {
  name: 'Base Sepolia',
  rpc: 'https://sepolia.base.org',
  chainId: '84532',
  symbol: 'ETH',
  explorer: 'https://sepolia.basescan.org'
};
```

---

## ▶️ Run the bot

```bash
npx tsx install-metamask.ts
```

The bot will:
- Set up MetaMask
- Open [https://unlock3d.t3rn.io](https://unlock3d.t3rn.io)
- Wait for the page to load
- Select source network/token
- Set amount to swap
- Handle MetaMask popups to confirm transactions

---

## 🧠 Technologies

- [Playwright](https://playwright.dev/) — browser automation
- [MetaMask](https://metamask.io/) — wallet extension
- [TypeScript](https://www.typescriptlang.org/)
- [TSX](https://github.com/esbuild-kit/tsx) — TS runtime

---

## ⚠️ Disclaimer

- Use only in **testnets**
- Never expose real private keys
- Built for dev/test automation only

---

## ✅ Future Plans

- [ ] Multi-network support (Optimism, Arbitrum, etc.)
- [ ] Auto-sign MetaMask transactions
- [ ] `.env` config support
- [ ] CLI options
- [ ] GitHub Actions integration for CI

---

## 📄 License

MIT — Use at your own risk.


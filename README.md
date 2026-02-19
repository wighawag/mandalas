<!--- -------------------------------------------- -->

# Mandalas

Mandalas are procedurally generated bitmaps recorded as NFTs on Ethereum. There are millions of millions of them (2^160)-1 to be exact — all unique.

Their eight-fold symmetry ensures that a single difference is actually repeated. As such they are also great for identity icons, improving upon the classic [blockies](https://github.com/ethereum/blockies). Their number is actually equal to the number of Ethereum addresses, and so each address has a unique representation in the form of a Mandala.

## Key Features

- **Procedurally Generated**: Each Mandala is algorithmically generated on-chain
- **Fully On-Chain**: Bitmap and metadata are fully generated on-chain — the 8x8 bitmap is embedded in an SVG wrapper for scaling. No backend required
- **Unique Identity Icons**: Eight-fold symmetry creates unique visual representations tied to Ethereum addresses
- **Mint/Burn Mechanism**: Mint at a rising price, burn to get back 95% of the current price
- **No External Dependencies**: Uses `tokenURI` standard — images are embedded directly in the contract

## Technical Stack

This is a monorepo using pnpm workspaces with three packages:

- **[`common-lib`](common-lib/)**: Shared TypeScript library for mandala generation
- **[`contracts`](contracts/)**: Solidity smart contracts (v0.7.1) for Ethereum
- **[`web`](web/)**: SvelteKit web application for minting and viewing mandalas

### Smart Contract

The smart contract implements:

- **Linear Pricing Curve**: Price increases with supply (`initialPrice + supply * linearCoefficient`)
- **95% Refund on Burn**: Users receive 95% of the current price when burning
- **Creator Royalty**: Configurable cut (default <20%) goes to the contract creator
- **On-Chain Bitmap Generation**: Token metadata includes an 8x8 bitmap that is generated entirely on-chain and wrapped in SVG for scaling

**Contract Address**: [0xDaCa87395f3b1Bbc46F3FA187e996E03a5dCc985](https://etherscan.io/address/0xDaCa87395f3b1Bbc46F3FA187e996E03a5dCc985)

## Developers

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start local development environment
pnpm start
```

### Testing

```bash
# Run smart contract tests
pnpm contracts:test

```

### Building

```bash
# Build contracts and web for production
pnpm build

# Serve the production build
pnpm serve
```

## Project Structure

```
mandalas/
├── common-lib/           # Shared library for mandala generation
├── contracts/            # Ethereum smart contracts
│   ├── src/
│   │   └── MandalaToken.sol  # Main NFT contract
│   ├── test/             # Contract tests
│   └── deployments/      # Contract deployment data
├── web/                  # SvelteKit web application
```

## Inspiration

This project was inspired by [Neolastics](https://neolastics.com/) by Simon de la Rouviere, which implements a similar mint/burn mechanism.

## License

See [LICENSE](LICENSE) for details.

---

Created by [Ronan Sandford](https://ronan.eth.limo) ([wighawag](https://twitter.com/wighawag)) as part of the [NFT Hack](https://nft.ethglobal.co/).

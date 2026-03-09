# Magma Marketplace Smart Contracts

Solidity smart contracts for Magma Marketplace on Avalanche C-Chain.

## Contracts

### MagmaEscrow.sol
Escrow contract for physical item transactions with:
- Secure fund holding until delivery confirmed
- Real tracking API integration via oracle
- 7-day dispute window after delivery
- Adjustable platform fees (default 2.5%)
- Multi-carrier support (USPS, UPS, FedEx, DHL)

### MagmaNFTMarketplace.sol
NFT marketplace supporting:
- ERC-721 listings (fixed price + auctions)
- ERC-1155 listings (with quantity support)
- Make offers on any NFT
- EIP-2981 royalty support
- Adjustable platform fees

## Setup

```bash
# Install dependencies
cd contracts
npm install

# Create .env file
cp .env.example .env
# Add your private key and API keys
```

## Environment Variables

```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
SNOWTRACE_API_KEY=your_snowtrace_api_key
FEE_RECIPIENT=address_to_receive_platform_fees
```

## Deployment

### Fuji Testnet (Recommended for testing)
```bash
npm run deploy:fuji
```

### Mainnet
```bash
npm run deploy:mainnet
```

## Contract Verification

```bash
npm run verify:fuji CONTRACT_ADDRESS CONSTRUCTOR_ARGS
npm run verify:mainnet CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

## Networks

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Fuji Testnet | 43113 | https://api.avax-test.network/ext/bc/C/rpc |
| Mainnet | 43114 | https://api.avax.network/ext/bc/C/rpc |

## Testing

```bash
npm test
```

## Order Flow (Escrow)

1. **Buyer creates order** - Sends AVAX to escrow with seller address and item details
2. **Seller ships item** - Provides carrier and tracking number
3. **Tracking updates** - Oracle updates status based on real carrier data
4. **Delivery confirmed** - 7-day dispute window begins
5. **Dispute window ends** - Funds automatically released to seller
   - OR buyer opens dispute within 7 days

## NFT Marketplace Flow

### Fixed Price Listing
1. Seller lists NFT with price
2. Buyer purchases at listed price
3. Platform fee deducted, royalties paid, seller receives remainder

### Auction
1. Seller creates auction with starting price and duration
2. Bidders place bids (min 5% increment)
3. Auction extends 10 minutes if bid placed in final 10 minutes
4. Winner receives NFT, seller receives payment minus fees

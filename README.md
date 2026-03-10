# Magma Marketplace (MMP)

A decentralized NFT marketplace built on Avalanche (AVAX). Trade collectibles securely with escrow protection, seller ratings, and full wallet integration.

Works as a **mobile app** (iOS/Android), **website**, and **installable PWA** on any device including PC.

## Project Structure

```
MMP/
├── mobile/          # Expo React Native app (iOS, Android, Web/PWA)
├── backend/         # Hono + Bun API server
└── contracts/       # Solidity smart contracts (Avalanche C-Chain)
```

## Tech Stack

- **Mobile/Web**: Expo SDK 53, React Native, NativeWind, React Query, Zustand
- **Backend**: Hono, Bun, Prisma, Better Auth
- **Contracts**: Solidity, Hardhat, OpenZeppelin
- **Chain**: Avalanche C-Chain (AVAX)

## Getting Started

### Mobile App / Website
```bash
cd mobile
bun install
bun start          # mobile app
npx expo start --web   # run as website
```

### Deploy to Web (Vercel)
```bash
cd mobile
npx expo export --platform web   # builds to /dist
# Then drag /dist folder to vercel.com or connect your GitHub repo
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
bun install
bun dev
```

### Smart Contracts
```bash
cd contracts
cp .env.example .env
npm install
npx hardhat compile
```

## Environment Variables

Copy `.env.example` to `.env` in `mobile/` and `backend/` and fill in your values. Never commit `.env` files.

## Features

- 🔥 Animated magma splash screen
- 🛒 NFT marketplace (fixed price + auctions)
- 🔒 Escrow-protected trades
- ⭐ Crown tier seller ratings
- 💬 In-app messaging
- 👛 Avalanche wallet integration
- 📱 QR code support
- 🏪 Seller shops
- 🌐 Works on web, mobile, and desktop as a PWA

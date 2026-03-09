# Magma Market - Collectibles Marketplace

A mobile marketplace app for buying, selling, and trading collectibles with built-in wallet integration and secure escrow system.

## Backend & Authentication

The app now uses a real backend with a shared database:

- **Auth**: Better Auth with Email OTP (no passwords — users receive a 6-digit code by email)
- **Database**: SQLite via Prisma ORM at `backend/prisma/dev.db`
- **API**: Hono backend at port 3000 with routes for users, listings, messages, and ratings
- **Session**: React Query wrapping `authClient.getSession()` for reliable mobile session handling

### Auth Flow
1. User enters email on sign-in screen
2. 6-digit OTP sent to their email via Vibecode SMTP
3. User enters code → signed in and navigated to app
4. All data is now shared across devices and users

## Features

### Messages Tab
- **Conversation List** - See all active conversations sorted by recency (live from backend, polls every 5s)
- **User Search** - Search any registered user by name or username to start a conversation
- **Unread Badge** - Orange badge on tab icon shows total unread count (polls every 10s)
- **Chat Screen** - Full thread with orange bubbles, date groups, timestamps, auto-scroll
- **Message Input** - Multiline text box with send button
- **Message from Profile** - "Message" button on any user's public profile

- **Chat Screen** - Full chat interface with message bubbles, timestamps, and date grouping
- **Message Input** - Text box with send button; supports multiline messages
- **Message from Profile** - "Message" button on any user's public profile page

### Home Tab
- **Featured Listings** - Highest priced items showcased
- **Recent Listings** - Latest items added to the marketplace
- **Quick Actions** - Fast access to Browse, Sell, Escrow, and Auctions
- **Market Stats** - Active listings count, total volume, and average price
- **Trust Badges** - Escrow protection, ratings system, fast transactions

### Community Tab
- **Top Sellers** - Leaderboard of highest-rated sellers with crown tiers
- **Recent Sales** - Activity feed of completed transactions
- **Community Stats** - Total sellers, sales, and trading volume
- **Seller Tiers Guide** - Crown tier system explanation

### Marketplace Tab
- **Create Listings** - List items for sale, auction, or trade
- **Image Upload** - Upload photos from library or take new photos with camera
- **Categories** - Cards, Collectibles, Art, and Other
- **Item Types:**
  - **Physical** - Ships to buyer's address with tracking
  - **Digital** - Instant delivery with download links/access codes
  - **NFT** - On-chain assets on Avalanche blockchain
- **Listing Types:**
  - **Fixed Price** - Buy it now at set price
  - **Auction** - Place bids, highest bidder wins
  - **Trade** - Exchange items with other users
- **Blind Shipping (Address Protection):**
  - Buyers enter their full shipping address at checkout
  - Sellers only see masked address (e.g., "J. S., Chicago IL")
  - Full address used only for shipping label generation
  - Privacy-first approach protects buyer information
- **Shipping Label Generation:**
  - Platform generates shipping labels with masked addresses
  - Tracking numbers and carrier info provided
  - Sellers can mark items as shipped/delivered
  - Full shipping status tracking (Label Ready > Shipped > Delivered)
- **Escrow System:**
  - Funds held securely until buyer confirms delivery
  - Buyer releases funds after receiving and verifying item
  - Protection for both buyers and sellers
- **Seller Verification:**
  - Verified badge for trusted sellers (10+ sales, 4.0+ rating)
  - Seller stats displayed (total sales, average rating)
  - Build reputation through successful transactions
- **Review System:**
  - Rate sellers from 1-5 stars after purchase
  - Leave detailed feedback comments
  - View seller reviews before buying
- **Seller Ranking System:**
  - **5-Star Rating** - Comprehensive rating across categories:
    - Delivery effectiveness
    - Timeliness
    - Communication
    - Item accuracy
    - Packaging quality (physical items only)
  - **Crown Tiers** based on average rating:
    - **Coal Crown** (0-1.49 stars) - Needs improvement
    - **Bronze Crown** (1.5-2.49 stars) - Getting started
    - **Silver Crown** (2.5-3.49 stars) - Good seller
    - **Gold Crown** (3.5-4.49 stars) - Great seller
    - **Platinum Crown** (4.5-5 stars) - Top seller
    - **Sapphire Crystal Crown** - Platform Owner exclusive
  - **Sentiment Tracking** - Positive, neutral, and negative review counts
  - **Top Seller Badge** - For sellers with 4.5+ rating and 10+ sales
  - **Verified Badge** - For sellers with 5+ reviews and 4.0+ rating
- **Public Profiles:**
  - View any user's profile by tapping their name
  - See their crown tier, rating summary, and reviews
  - Category breakdowns (delivery, timeliness, communication, etc.)
  - Review history with comments and seller responses
- **Watchlist:**
  - Save listings to watch later
  - Track watch count on listings
  - Filter view by watchlist items
- **Offer System:**
  - Make offers below asking price on fixed listings
  - Optional message with offer
  - 48-hour offer expiration
  - Sellers can accept, reject, or counter offers
- **Auction Features:**
  - **Reserve Price** - Hidden minimum price for auctions
  - **Buy Now** - Instant purchase option on auctions
  - Reserve met indicator
  - Bid history tracking
- **Featured Listings:**
  - Promote listings with featured badge
  - Featured filter tab
  - Duration-based featuring
- **Similar Items:**
  - Recommendations based on category and item type
  - Shown on listing detail pages
- **My Sales Tab** - View and manage your sold items
- **Shipping Support** - Set shipping cost, origin, and estimated delivery for physical items
- **Adjustable Platform Fee** - 0-2% fee (master account only)
- **Search & Filter** - Find items by category, watchlist, featured, or keywords
- **Transaction Tracking** - View purchase history and stats
- **Browse Shops** - Quick access to shop discovery from marketplace

### Shops
- **Create Your Shop** - Set up a personalized storefront
- **Shop Name & Description** - Customize your shop identity
- **Shop Categories** - General, Collectibles, Electronics, Clothing, Art, Gaming, Sports, Jewelry, Handmade, Vintage, Other
- **Shop Search** - Find shops by name, username, or description
- **Category Filtering** - Browse shops by category
- **Shop Profiles:**
  - Banner and logo customization
  - Rating display tied to marketplace reputation
  - Crown tier badge based on seller rating
  - Follower count and sales stats
  - Active listings display
- **Follow Shops** - Follow favorite sellers for updates
- **Rating Integration** - Shop rating reflects owner's marketplace reputation
- **Shop Management:**
  - Edit shop details
  - Toggle shop visibility (active/inactive)
  - Delete shop

### Wallet Tab (Avalanche/AVAX)
- **Connect Wallet** - Track any Avalanche C-Chain wallet address
- **Multi-Wallet Support** - Save and manage multiple wallet addresses
- **Wallet Switcher** - Easily switch between saved wallets
- **Real-time Balance** - View AVAX balance with USD conversion
- **Live Price** - Current AVAX price from CoinGecko
- **Transaction History** - View send/receive transactions
- **Receive AVAX** - Display wallet address with QR code for receiving funds
- **QR Code Generation** - Scannable QR code for your wallet address
- **Snowtrace Integration** - Open transactions in block explorer
- **Auto-refresh** - Balance updates every 30 seconds
- **Wallet Management** - Rename and remove saved wallets
- **Secure** - Read-only tracking, no private keys stored

### Profile Tab
- **Account Management** - View and edit profile
- **Crown Display** - Your ranking crown prominently displayed
- **Star Rating** - Your average rating with review count
- **Sentiment Breakdown** - Positive, neutral, and negative review counts
- **My Shop** - Quick access to create or manage your shop
- **Wallet Integration** - Link/unlink AVAX wallet
- **Shipping Address** - Save shipping address for physical purchases
- **Trading Stats** - Sales, purchases, and trades count
- **Master Account Features:**
  - Platform revenue tracking
  - Adjustable platform fee slider (0-2%)
  - **Delist Tool** - Safety & moderation tool with:
    - Manual search by title, seller, or description
    - **Keyword Filter** - Search for suspicious words with quick filters (drugs, weapons, counterfeit, stolen, explicit)
    - **AI Scanner** - AI-powered scanning of listing text AND images for violations
    - Automatic detection of suspicious keywords in all listings
    - Confidence levels (High/Medium/Low) for AI-flagged items
- **Sign Out** - Secure logout
- **Delete Account** - Remove all data

### User Authentication
- **Sign Up** - Create account with email, password, and username
- **Sign In** - Secure login with password hashing
- **User Profiles** - Customizable display name and avatar
- **Link Wallet** - Connect AVAX wallet to your profile
- **Reputation System** - Track your marketplace reputation score

## Tech Stack

- Expo SDK 53 with React Native
- React Query for data fetching and caching
- Zustand for state management
- NativeWind (Tailwind CSS) for styling
- Lucide icons
- expo-linear-gradient for visual effects
- react-native-reanimated for animations

## Avalanche C-Chain Integration

### Smart Contracts (`/contracts`)
- **MagmaEscrow.sol** - Escrow contract for physical item transactions
  - Secure fund holding until delivery confirmed
  - Real tracking API integration via oracle (USPS, UPS, FedEx, DHL)
  - 7-day dispute window after delivery
  - Adjustable platform fees (default 2.5%)

- **MagmaNFTMarketplace.sol** - NFT marketplace contract
  - ERC-721 and ERC-1155 support
  - Fixed price and auction listings
  - Make offers on any NFT
  - EIP-2981 royalty support

### Backend Endpoints (`/backend`)
- `/api/tracking/:trackingNumber` - Track packages across carriers
- `/api/tracking/batch` - Batch tracking for multiple packages
- `/api/contracts/config` - Get contract configuration
- `/api/contracts/abi` - Get contract ABIs for client interaction
- `/api/contracts/escrow/calculate-fee` - Calculate platform fees
- `/api/contracts/networks` - Get supported networks (Fuji testnet, Mainnet)

### Networks
| Network | Chain ID | Explorer |
|---------|----------|----------|
| Avalanche Fuji (Testnet) | 43113 | testnet.snowtrace.io |
| Avalanche Mainnet | 43114 | snowtrace.io |

### Deployment
```bash
cd contracts
npm install
npm run deploy:fuji    # Testnet
npm run deploy:mainnet # Mainnet
```


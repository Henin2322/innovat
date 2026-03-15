<<<<<<< HEAD
# Innovate2Earn — Full Stack Web3 dApp

Antigravity UI · Next.js 14 · Solidity · Polygon Mumbai

## Quick Start (15 minutes)

### Prerequisites
- Node.js 18+
- MetaMask with Polygon Mumbai test network added
- Free API keys (see `.env.example`)

---

## Step 1 — Get Free Test MATIC

1. Go to https://faucet.polygon.technology/
2. Connect MetaMask, switch to **Mumbai Testnet**
3. Paste your wallet address → receive free test MATIC

To add Mumbai to MetaMask:
- Network Name: Mumbai Testnet
- RPC URL: https://rpc-mumbai.maticvigil.com
- Chain ID: 80001
- Symbol: MATIC
- Explorer: https://mumbai.polygonscan.com

---

## Step 2 — Get Free API Keys

| Service | URL | Used For |
|---|---|---|
| Alchemy (Mumbai RPC) | https://alchemy.com | Contract deployment |
| OpenAI | https://platform.openai.com | AI challenge generation |
| nft.storage | https://nft.storage | IPFS submission storage |
| Polygonscan | https://mumbai.polygonscan.com/apis | Contract verification |

---

## Step 3 — Install & Configure

```bash
# Clone and install everything
cd innovate2earn

# Install contracts dependencies
cd contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Copy env files
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env.local
```

Fill in your API keys in both `.env` files.

---

## Step 4 — Deploy Smart Contracts

```bash
cd contracts

# Compile
npx hardhat compile

# Deploy to Mumbai
npx hardhat run scripts/deploy.js --network mumbai

# You'll see output like:
# INNOVToken deployed to: 0xABC...
# ChallengeRewards deployed to: 0xDEF...
# NFTCertificate deployed to: 0x123...
# Governance deployed to: 0x456...
```

Copy those addresses into `frontend/.env.local`

---

## Step 5 — Run the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 — connect MetaMask → start innovating.

---

## Project Structure

```
innovate2earn/
├── contracts/                  # Hardhat project
│   ├── contracts/
│   │   ├── INNOVToken.sol      # ERC-20 governance token
│   │   ├── ChallengeRewards.sol # Submit ideas, earn XP + tokens
│   │   ├── NFTCertificate.sol  # ERC-721 evolving certificates
│   │   └── Governance.sol      # Quadratic voting
│   ├── scripts/deploy.js
│   └── hardhat.config.js
│
└── frontend/                   # Next.js 14 app
    ├── app/
    │   ├── page.tsx            # Dashboard (Antigravity UI)
    │   ├── challenges/         # Challenge browser
    │   ├── governance/         # Voting page
    │   ├── leaderboard/        # On-chain rankings
    │   └── api/                # Backend API routes
    │       ├── challenges/     # CRUD for challenges
    │       ├── submit/         # Handle + store submissions
    │       ├── ai-challenge/   # GPT-powered prompt gen
    │       └── governance/     # Proposal management
    ├── components/             # Reusable UI components
    ├── hooks/                  # Wagmi contract hooks
    └── lib/                    # Contract ABIs + config
```
=======
# innovat
web3 hackathon
>>>>>>> dfc940f3d0eccdd15c85e2facd6a4d871859a930

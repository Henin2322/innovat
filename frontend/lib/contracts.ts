// lib/contracts.ts
// Contract addresses and ABIs for frontend integration
// Addresses are loaded from environment variables after deployment

export const CONTRACT_ADDRESSES = {
  innovToken: process.env.NEXT_PUBLIC_INNOV_TOKEN_ADDRESS as `0x${string}`,
  challengeRewards: process.env.NEXT_PUBLIC_CHALLENGE_REWARDS_ADDRESS as `0x${string}`,
  nftCertificate: process.env.NEXT_PUBLIC_NFT_CERTIFICATE_ADDRESS as `0x${string}`,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS as `0x${string}`,
};

export const INNOV_TOKEN_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { name: "totalMinted", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }] },
  { name: "Transfer", type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false }
    ] },
] as const;

export const CHALLENGE_REWARDS_ABI = [
  { name: "getActiveChallenges", type: "function", stateMutability: "view",
    inputs: [], outputs: [{
      name: "", type: "tuple[]",
      components: [
        { name: "id", type: "uint256" },
        { name: "title", type: "string" },
        { name: "category", type: "string" },
        { name: "difficulty", type: "string" },
        { name: "xpReward", type: "uint256" },
        { name: "multiplier", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "active", type: "bool" },
        { name: "submissionCount", type: "uint256" },
      ]
    }]
  },
  { name: "getUserProfile", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "totalXP", type: "uint256" },
        { name: "level", type: "uint256" },
        { name: "submissionCount", type: "uint256" },
        { name: "lastSubmissionTime", type: "uint256" },
        { name: "currentStreak", type: "uint256" },
        { name: "longestStreak", type: "uint256" },
        { name: "welcomeNFTClaimed", type: "bool" },
      ]
    }]
  },
  { name: "getXPForNextLevel", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "current", type: "uint256" },
      { name: "needed", type: "uint256" },
    ]
  },
  { name: "submitIdea", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "challengeId", type: "uint256" },
      { name: "ipfsCid", type: "string" },
    ],
    outputs: []
  },
  { name: "claimWelcomeNFT", type: "function", stateMutability: "nonpayable",
    inputs: [], outputs: []
  },
  { name: "hasSubmitted", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }, { name: "challengeId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  { name: "IdeaSubmitted", type: "event",
    inputs: [
      { name: "submissionId", type: "uint256", indexed: true },
      { name: "challengeId", type: "uint256", indexed: true },
      { name: "submitter", type: "address", indexed: true },
      { name: "ipfsCid", type: "string", indexed: false },
      { name: "xpAwarded", type: "uint256", indexed: false },
      { name: "tokensAwarded", type: "uint256", indexed: false },
    ]
  },
  { name: "LevelUp", type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "newLevel", type: "uint256", indexed: false },
    ]
  },
] as const;

export const GOVERNANCE_ABI = [
  { name: "getActiveProposals", type: "function", stateMutability: "view",
    inputs: [], outputs: [{
      name: "", type: "tuple[]",
      components: [
        { name: "id", type: "uint256" },
        { name: "title", type: "string" },
        { name: "description", type: "string" },
        { name: "proposer", type: "address" },
        { name: "forVotes", type: "uint256" },
        { name: "againstVotes", type: "uint256" },
        { name: "forTokens", type: "uint256" },
        { name: "againstTokens", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "executed", type: "bool" },
        { name: "passed", type: "bool" },
        { name: "fundingAmount", type: "uint256" },
      ]
    }]
  },
  { name: "castVote", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "support", type: "bool" },
      { name: "tokenAmount", type: "uint256" },
    ],
    outputs: []
  },
  { name: "getVotePercentage", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "forPct", type: "uint256" },
      { name: "againstPct", type: "uint256" },
    ]
  },
  { name: "votes", type: "function", stateMutability: "view",
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "voter", type: "address" },
    ],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "hasVoted", type: "bool" },
        { name: "support", type: "bool" },
        { name: "tokensLocked", type: "uint256" },
        { name: "votingPower", type: "uint256" },
      ]
    }]
  },
] as const;

export const NFT_CERTIFICATE_ABI = [
  { name: "getUserCertificates", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }]
  },
  { name: "certificates", type: "function", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "owner", type: "address" },
        { name: "level", type: "uint256" },
        { name: "tier", type: "string" },
        { name: "mintedAt", type: "uint256" },
      ]
    }]
  },
  { name: "tokenURI", type: "function", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
] as const;

// Level names mapping
export const LEVEL_NAMES: Record<number, string> = {
  1: "Idea Seed",
  2: "Curious Thinker",
  3: "Idea Sprout",
  4: "Concept Builder",
  5: "Innovation Spark",
  6: "Protocol Thinker",
  7: "Design Pioneer",
  8: "Chain Innovator",
  9: "Idea Veteran",
  10: "Innovation Sage",
  11: "Protocol Pioneer",
  12: "Idea Architect",
  13: "Innovation Architect",
  14: "Protocol Architect",
  15: "Innovation Legend",
};

export const CATEGORY_COLORS: Record<string, string> = {
  climate: "#2DD4BF",
  web3: "#C8FF00",
  ux: "#22C55E",
  ai: "#FF3CAC",
};

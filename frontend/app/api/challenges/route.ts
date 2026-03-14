// app/api/challenges/route.ts
// REST API for challenges — reads live data from the blockchain via viem
// GET  /api/challenges          → list active challenges
// POST /api/challenges          → create challenge (admin only, requires ADMIN_SECRET header)

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { polygonMumbai } from "viem/chains";
import { CONTRACT_ADDRESSES, CHALLENGE_REWARDS_ABI } from "@/lib/contracts";

const publicClient = createPublicClient({
  chain: polygonMumbai,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_URL || "https://rpc-mumbai.maticvigil.com"),
});

export async function GET() {
  try {
    const challenges = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.challengeRewards,
      abi: CHALLENGE_REWARDS_ABI,
      functionName: "getActiveChallenges",
    });

    // Serialize BigInt fields for JSON
    const serialized = (challenges as any[]).map((c) => ({
      id: c.id.toString(),
      title: c.title,
      category: c.category,
      difficulty: c.difficulty,
      xpReward: c.xpReward.toString(),
      multiplier: c.multiplier.toString(),
      deadline: c.deadline.toString(),
      active: c.active,
      submissionCount: c.submissionCount.toString(),
    }));

    return NextResponse.json({ challenges: serialized, count: serialized.length });
  } catch (error) {
    console.error("Challenges API error:", error);
    // Return seeded fallback data if contracts aren't deployed yet
    return NextResponse.json({
      challenges: [
        { id: "1", title: "Propose a climate solution for your city in 3 sentences", category: "climate", difficulty: "easy", xpReward: "50", multiplier: "200", submissionCount: "142" },
        { id: "2", title: "Invent a new use-case for ZK proofs in healthcare", category: "web3", difficulty: "hard", xpReward: "80", multiplier: "150", submissionCount: "89" },
        { id: "3", title: "Redesign the UX of a popular DeFi app", category: "ux", difficulty: "medium", xpReward: "60", multiplier: "100", submissionCount: "201" },
        { id: "4", title: "Build a mini AI agent that autonomously monitors on-chain governance", category: "ai", difficulty: "expert", xpReward: "120", multiplier: "300", submissionCount: "34" },
      ],
      count: 4,
      source: "fallback",
    });
  }
}

export async function POST(req: NextRequest) {
  // Admin-only: requires secret header
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  // Challenge creation is done on-chain via the deploy script or admin UI
  // This endpoint is a placeholder for future admin tooling
  return NextResponse.json({ message: "Use deploy script to create challenges on-chain", body });
}

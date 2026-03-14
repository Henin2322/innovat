// app/api/governance/route.ts
// Reads governance proposals from chain and returns enriched data
// GET  /api/governance           → list active proposals with vote percentages

import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { polygonMumbai } from "viem/chains";
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/lib/contracts";

const publicClient = createPublicClient({
  chain: polygonMumbai,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_MUMBAI_URL || "https://rpc-mumbai.maticvigil.com"),
});

export async function GET() {
  try {
    const proposals = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.governance,
      abi: GOVERNANCE_ABI,
      functionName: "getActiveProposals",
    });

    const enriched = await Promise.all(
      (proposals as any[]).map(async (p) => {
        let forPct = 50, againstPct = 50;
        try {
          const pcts = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.governance,
            abi: GOVERNANCE_ABI,
            functionName: "getVotePercentage",
            args: [p.id],
          }) as [bigint, bigint];
          forPct = Number(pcts[0]);
          againstPct = Number(pcts[1]);
        } catch {}

        return {
          id: p.id.toString(),
          title: p.title,
          description: p.description,
          proposer: p.proposer,
          forVotes: p.forVotes.toString(),
          againstVotes: p.againstVotes.toString(),
          forPct,
          againstPct,
          deadline: p.deadline.toString(),
          executed: p.executed,
          passed: p.passed,
          fundingAmount: p.fundingAmount.toString(),
        };
      })
    );

    return NextResponse.json({ proposals: enriched });
  } catch (error) {
    console.error("Governance API error:", error);
    return NextResponse.json({
      proposals: [
        { id: "1", title: "Open-Source Climate DAO Toolkit", description: "Fund development of an open-source toolkit enabling cities to launch climate-focused DAOs.", forPct: 72, againstPct: 28, deadline: String(Math.floor(Date.now() / 1000) + 172800) },
        { id: "2", title: "ZK Identity for Public Goods Registry", description: "Build a zero-knowledge identity layer for anonymous but verified contributions.", forPct: 48, againstPct: 52, deadline: String(Math.floor(Date.now() / 1000) + 432000) },
      ],
      source: "fallback",
    });
  }
}

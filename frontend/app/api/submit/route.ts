// app/api/submit/route.ts
// Handles idea submissions:
// 1. Validates the content
// 2. Uploads to IPFS via nft.storage (or mock for demo)
// 3. Returns the CID to the frontend which then writes it on-chain

import { NextRequest, NextResponse } from "next/server";

async function uploadToIPFS(content: string, metadata: object): Promise<string> {
  const apiKey = process.env.NFT_STORAGE_API_KEY;

  if (!apiKey || apiKey === "your_nft_storage_api_key") {
    // Demo mode: return a deterministic mock CID
    const hash = Buffer.from(content.slice(0, 32)).toString("base64url");
    return `bafybeimock${hash.slice(0, 20)}`;
  }

  const blob = new Blob(
    [JSON.stringify({ content, ...metadata, timestamp: new Date().toISOString() })],
    { type: "application/json" }
  );

  const response = await fetch("https://api.nft.storage/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: blob,
  });

  if (!response.ok) throw new Error("IPFS upload failed");

  const data = await response.json();
  return data.value.cid;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, content, walletAddress } = body;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Submission too short (min 10 chars)" }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: "Submission too long (max 5000 chars)" }, { status: 400 });
    }

    const cid = await uploadToIPFS(content, {
      challengeId,
      submitter: walletAddress || "anonymous",
      platform: "innovate2earn",
    });

    return NextResponse.json({
      cid,
      gateway: `https://nftstorage.link/ipfs/${cid}`,
      message: "Submission stored on IPFS",
    });
  } catch (error) {
    console.error("Submit API error:", error);
    return NextResponse.json({ error: "Submission failed", cid: `demo_${Date.now()}` }, { status: 500 });
  }
}

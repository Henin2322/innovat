// app/api/ai-challenge/route.ts
// Generates fresh innovation challenges using OpenAI GPT
// Falls back to a curated static list if no API key is configured

import { NextResponse } from "next/server";

const FALLBACK_CHALLENGES = [
  "Design a Web3-native loyalty system for sustainable fashion brands that rewards circular economy behavior on-chain.",
  "Propose a zero-knowledge proof system that lets climate scientists share sensitive environmental data with policymakers without exposing raw sources.",
  "Invent a decentralized autonomous organization structure for managing community-owned urban gardens using token-weighted voting.",
  "Create a blockchain-based credential system that helps underrepresented communities access microloans without traditional credit history.",
  "Design a tokenized carbon credit marketplace where individuals can earn rewards for daily low-carbon lifestyle choices verified through IoT devices.",
  "Build a Web3 reputation system for freelancers that is fully portable, censorship-resistant, and cross-platform.",
  "Propose a DAO governance model that gives more voting power to long-term community contributors rather than large token holders.",
];

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  // If no OpenAI key, return a random fallback
  if (!apiKey || apiKey.startsWith("sk-your")) {
    const challenge = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
    return NextResponse.json({ challenge, source: "static" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 120,
        temperature: 0.9,
        messages: [
          {
            role: "system",
            content:
              "You generate single, concise open-innovation challenge prompts for a Web3 platform. Each prompt should inspire creative solutions at the intersection of blockchain, sustainability, social impact, or emerging technology. Return ONLY the challenge text, no numbering or formatting. Keep it under 2 sentences.",
          },
          {
            role: "user",
            content:
              "Generate one fresh innovation challenge for today. Make it specific, actionable, and relevant to Web3 or sustainability.",
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = await response.json();
    const challenge = data.choices?.[0]?.message?.content?.trim() || FALLBACK_CHALLENGES[0];
    return NextResponse.json({ challenge, source: "openai" });
  } catch (error) {
    console.error("AI challenge generation failed:", error);
    const challenge = FALLBACK_CHALLENGES[Math.floor(Math.random() * FALLBACK_CHALLENGES.length)];
    return NextResponse.json({ challenge, source: "fallback" });
  }
}

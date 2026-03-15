"use client";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, INNOV_TOKEN_ABI, CHALLENGE_REWARDS_ABI, LEVEL_NAMES } from "@/lib/contracts";
import Link from "next/link";

// Static leaderboard data — in production this would come from
// The Graph subgraph indexing Transfer + IdeaSubmitted events
const STATIC_LEADERBOARD = [
  { rank: 1, name: "nebulabuilder.eth", address: "0x4a2b...91cc", tokens: "1840", level: 18, submissions: 47, streak: 21 },
  { rank: 2, name: "0xproto", address: "0x7f1e...34ab", tokens: "1430", level: 15, submissions: 38, streak: 14 },
  { rank: 3, name: "crvdao.lens", address: "0x2c9d...77fe", tokens: "1140", level: 12, submissions: 31, streak: 9 },
  { rank: 4, name: "w3bsurfer.eth", address: "0x8b3a...12dc", tokens: "890", level: 10, submissions: 24, streak: 7 },
  { rank: 5, name: "zkbuilder", address: "0x1f4c...56ef", tokens: "720", level: 9, submissions: 19, streak: 5 },
  { rank: 6, name: "solarpunk.dao", address: "0x9e2b...34ca", tokens: "580", level: 8, submissions: 16, streak: 4 },
  { rank: 7, name: "futureproof.eth", address: "0x3d7f...89ab", tokens: "420", level: 7, submissions: 12, streak: 3 },
  { rank: 8, name: "chainweaver", address: "0x6a1e...45cd", tokens: "310", level: 6, submissions: 9, streak: 2 },
];

export default function LeaderboardPage() {
  const { address } = useAccount();

  const { data: myBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.innovToken,
    abi: INNOV_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: myProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.challengeRewards,
    abi: CHALLENGE_REWARDS_ABI,
    functionName: "getUserProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const myTokens = myBalance ? parseFloat(formatEther(myBalance as bigint)).toFixed(0) : "0";
  const myLevel = myProfile ? Number((myProfile as any).level) || 1 : 1;
  const mySubmissions = myProfile ? Number((myProfile as any).submissionCount) : 0;

  const rankColors = ["var(--lime)", "#94A3B8", "#CD7F32"];

  return (
    <>
      <nav className="ag-nav">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="ag-nav-logo">INNOV<span style={{ color: "var(--lime)" }}>2</span>EARN</div>
        </Link>
        <div className="ag-nav-links">
          <Link href="/#challenges" className="ag-nav-link">CHALLENGES</Link>
          <Link href="/#governance" className="ag-nav-link">GOVERNANCE</Link>
          <Link href="/my-nfts" className="ag-nav-link">MY NFTS</Link>
        </div>
      </nav>

      <div className="ag-page">
        <div style={{ marginBottom: 48 }}>
          <h1 className="ag-heading" style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}>
            LEADER<br /><span style={{ color: "var(--lime)" }}>BOARD</span>
          </h1>
          <p style={{ opacity: 0.4, fontFamily: "var(--font-mono)" }}>
            Rankings update in real-time from Polygon Mumbai · Season 1
          </p>
        </div>

        {/* My stats strip */}
        {address && (
          <div className="ag-card featured float-b" style={{ marginBottom: 40, "--tilt": "1.5deg" } as any}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: 3, color: "var(--magenta)", marginBottom: 8 }}>
              YOUR STATS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                { label: "TOKENS", val: `${myTokens} $INNOV` },
                { label: "LEVEL", val: `${myLevel} — ${LEVEL_NAMES[myLevel] || "Innovator"}` },
                { label: "SUBMISSIONS", val: mySubmissions.toString() },
                { label: "WALLET", val: `${address.slice(0, 6)}…${address.slice(-4)}` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5, marginBottom: 4 }}>{label}</div>
                  <div className="ag-heading" style={{ fontSize: 16, color: "var(--void)" }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="ag-card dark float-a" style={{ "--tilt": "-1deg" } as any}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 120px 100px", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
            {["RANK", "INNOVATOR", "$INNOV", "SUBMISSIONS", "STREAK"].map((h) => (
              <div key={h} style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", fontFamily: "var(--font-display)" }}>{h}</div>
            ))}
          </div>

          {STATIC_LEADERBOARD.map((row) => (
            <div key={row.rank} style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 140px 120px 100px",
              gap: 16,
              padding: "14px 0",
              borderBottom: "1px solid rgba(200,255,0,0.06)",
              position: "relative",
              transition: "transform 0.15s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <span className="lb-ghost">{row.rank}</span>
              <div className="ag-heading" style={{ fontSize: 32, color: rankColors[row.rank - 1] || "var(--muted)", position: "relative", zIndex: 1 }}>
                {row.rank}
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="ag-heading" style={{ fontSize: 18, color: "var(--bone)" }}>{row.name}</div>
                <div style={{ fontSize: 11, opacity: 0.4, fontFamily: "var(--font-mono)" }}>{row.address} · {LEVEL_NAMES[row.level] || "Innovator"}</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", color: "var(--lime)", fontWeight: 600, alignSelf: "center" }}>
                {row.tokens}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", opacity: 0.7, alignSelf: "center" }}>{row.submissions}</div>
              <div style={{ fontFamily: "var(--font-mono)", color: "var(--magenta)", alignSelf: "center" }}>🔥 {row.streak}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 24, fontSize: 11, opacity: 0.3, fontFamily: "var(--font-mono)" }}>
          * Full on-chain leaderboard requires The Graph subgraph. See README for setup instructions.
        </p>
      </div>
    </>
  );
}

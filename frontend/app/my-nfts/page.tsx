"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACT_ADDRESSES, NFT_CERTIFICATE_ABI } from "@/lib/contracts";
import Link from "next/link";

const TIER_STYLES: Record<string, { bg: string; accent: string; label: string }> = {
  bronze:   { bg: "#1A0800", accent: "#CD7F32", label: "BRONZE SEED" },
  silver:   { bg: "#0D0D1A", accent: "#94A3B8", label: "SILVER SPARK" },
  gold:     { bg: "#1A1000", accent: "#FFB800", label: "GOLD FLAME" },
  platinum: { bg: "#0A0A0F", accent: "#FF3CAC", label: "PLATINUM ARCHITECT" },
  diamond:  { bg: "#04040A", accent: "#C8FF00", label: "DIAMOND LEGEND" },
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  bronze:   "Awarded for connecting your wallet and joining the Innovate2Earn ecosystem.",
  silver:   "Earned at Level 3 — you've proven consistent innovation.",
  gold:     "Earned at Level 7 — a true Design Pioneer.",
  platinum: "Earned at Level 12 — you've reached Idea Architect status.",
  diamond:  "Earned at Level 15 — Innovation Legend. The highest tier.",
};

function NFTCard({ tokenId, tier, level, mintedAt }: { tokenId: string; tier: string; level: number; mintedAt: number }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.bronze;
  const date = new Date(mintedAt * 1000).toLocaleDateString();

  return (
    <div className="ag-card float-b" style={{
      background: style.bg,
      border: `2px solid ${style.accent}`,
      color: style.accent,
      "--tilt": "2deg",
      padding: 0,
      overflow: "hidden",
    } as any}>
      <div style={{
        background: style.bg, padding: "32px 24px 24px",
        textAlign: "center", borderBottom: `1px solid ${style.accent}30`,
      }}>
        <div className="ag-heading" style={{ fontSize: 11, letterSpacing: 4, opacity: 0.5, marginBottom: 16 }}>
          INNOVATE2EARN CERTIFICATE
        </div>
        <div className="ag-heading" style={{ fontSize: 48, color: style.accent, lineHeight: 1 }}>
          {style.label.split(" ")[0]}
        </div>
        <div className="ag-heading" style={{ fontSize: 20, opacity: 0.7 }}>
          {style.label.split(" ").slice(1).join(" ")}
        </div>
        <div style={{ margin: "20px 0", fontSize: 11, opacity: 0.4, fontFamily: "var(--font-mono)" }}>
          TOKEN #{tokenId} · LEVEL {level}
        </div>
        <div style={{
          border: `1px solid ${style.accent}`,
          padding: "6px 12px", display: "inline-block",
          fontSize: 12, fontFamily: "var(--font-mono)",
        }}>
          ON-CHAIN · POLYGON MUMBAI
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        <p style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.6, marginBottom: 16, fontFamily: "var(--font-mono)", color: "var(--bone)" }}>
          {TIER_DESCRIPTIONS[tier]}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.5, fontFamily: "var(--font-mono)" }}>
          <span>MINTED: {date}</span>
          <span>TIER: {tier.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

function LockedTier({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier];
  return (
    <div className="ag-card" style={{
      background: "var(--surface)", border: "1px solid rgba(200,255,0,0.1)",
      opacity: 0.4, textAlign: "center", padding: 32,
    }}>
      <div className="ag-heading" style={{ fontSize: 32, color: "var(--muted)", marginBottom: 8 }}>🔒</div>
      <div className="ag-heading" style={{ fontSize: 18, color: "var(--muted)" }}>{style.label}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8, fontFamily: "var(--font-mono)" }}>
        {tier === "silver" ? "Reach Level 3" :
         tier === "gold" ? "Reach Level 7" :
         tier === "platinum" ? "Reach Level 12" :
         "Reach Level 15"}
      </div>
    </div>
  );
}

export default function NFTsPage() {
  const { address, isConnected } = useAccount();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [displayNFTs, setDisplayNFTs] = useState<any[]>([]);

  const { data: tokenIds, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.nftCertificate,
    abi: NFT_CERTIFICATE_ABI,
    functionName: "getUserCertificates",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    console.log("NFTs Page - Connection:", isConnected, "Address:", address);
    console.log("NFTs Page - Contract Data:", tokenIds, "Error:", isError, "Loading:", isLoading);

    if (tokenIds && (tokenIds as any[]).length > 0) {
      console.log("NFTs Page - Real NFTs found, disabling Demo Mode");
      setIsDemoMode(false);
      // Logic for real NFTs would go here
      setDisplayNFTs([]); 
    } else if (isConnected && (isError || !tokenIds || (tokenIds as any[]).length === 0)) {
      console.log("NFTs Page - Switching to Demo Mode");
      setIsDemoMode(true);
      setDisplayNFTs([
        { tokenId: "1", tier: "bronze", level: 1, mintedAt: Math.floor(Date.now() / 1000) - 86400 * 5 },
        { tokenId: "42", tier: "silver", level: 3, mintedAt: Math.floor(Date.now() / 1000) - 86400 * 2 },
      ]);
    }
  }, [tokenIds, isError, isConnected, address, isLoading]);

  const unlockedTiers = new Set(displayNFTs.map((n) => n.tier));
  const allTiers = ["bronze", "silver", "gold", "platinum", "diamond"];
  const lockedTiers = allTiers.filter((t) => !unlockedTiers.has(t));

  return (
    <>
      <nav className="ag-nav">
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className="ag-nav-logo">INNOV<span style={{ color: "var(--lime)" }}>2</span>EARN</div>
        </Link>
        <div className="ag-nav-links">
          <Link href="/#challenges" className="ag-nav-link">CHALLENGES</Link>
          <Link href="/#governance" className="ag-nav-link">GOVERNANCE</Link>
          <Link href="/leaderboard" className="ag-nav-link">LEADERBOARD</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isDemoMode && (
            <div style={{ background: "rgba(200,255,0,0.1)", border: "1px solid var(--lime)", color: "var(--lime)", padding: "2px 8px", borderRadius: 4, fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-display)" }}>
              DEMO MODE
            </div>
          )}
          <ConnectButton />
        </div>
      </nav>

      <div className="ag-page">
        <div style={{ marginBottom: 48 }}>
          <h1 className="ag-heading" style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}>
            MY<br /><span style={{ color: "var(--lime)" }}>CERTIFICATES</span>
          </h1>
          <p style={{ opacity: 0.4, fontFamily: "var(--font-mono)" }}>
            On-chain evolving NFTs · Fully stored on Polygon Mumbai · No external metadata
          </p>
        </div>

        {!isConnected ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ opacity: 0.5, marginBottom: 24 }}>Connect your wallet to see your certificates</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <p className="ag-section-label">EARNED CERTIFICATES ({displayNFTs.length})</p>
            <div className="ag-grid-2" style={{ marginBottom: 48 }}>
              {displayNFTs.map((nft) => (
                <NFTCard key={nft.tokenId} {...nft} />
              ))}
            </div>

            {lockedTiers.length > 0 && (
              <>
                <p className="ag-section-label">LOCKED — KEEP INNOVATING</p>
                <div className="ag-grid-4">
                  {lockedTiers.map((tier) => (
                    <LockedTier key={tier} tier={tier} />
                  ))}
                </div>
              </>
            )}

            <div className="ag-card dark" style={{ marginTop: 40, transform: "rotate(-0.5deg)" }}>
              <p className="ag-heading" style={{ fontSize: 18, marginBottom: 12, color: "var(--lime)" }}>HOW CERTIFICATES EVOLVE</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {allTiers.map((tier, i) => (
                  <div key={tier} style={{ textAlign: "center" }}>
                    <div className="ag-heading" style={{ fontSize: 14, color: TIER_STYLES[tier].accent }}>{TIER_STYLES[tier].label}</div>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, fontFamily: "var(--font-mono)" }}>
                      {i === 0 ? "Welcome" : `Level ${[3, 7, 12, 15][i - 1]}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

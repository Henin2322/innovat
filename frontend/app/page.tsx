"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther, parseEther } from "viem";
import {
  CONTRACT_ADDRESSES, INNOV_TOKEN_ABI, CHALLENGE_REWARDS_ABI,
  GOVERNANCE_ABI, LEVEL_NAMES, CATEGORY_COLORS
} from "@/lib/contracts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Challenge {
  id: bigint; title: string; category: string; difficulty: string;
  xpReward: bigint; multiplier: bigint; deadline: bigint;
  active: boolean; submissionCount: bigint;
}
interface Proposal {
  id: bigint; title: string; description: string; proposer: string;
  forVotes: bigint; againstVotes: bigint; deadline: bigint;
  executed: boolean; passed: boolean; fundingAmount: bigint;
}
interface UserProfile {
  totalXP: bigint; level: bigint; submissionCount: bigint;
  lastSubmissionTime: bigint; currentStreak: bigint;
  longestStreak: bigint; welcomeNFTClaimed: boolean;
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({
  challenge, onClose, onSubmit
}: {
  challenge: Challenge;
  onClose: () => void;
  onSubmit: (challengeId: bigint, text: string) => void;
}) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setUploading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id.toString(), content: text }),
      });
      const { cid } = await res.json();
      onSubmit(challenge.id, cid);
    } catch (e) {
      console.error(e);
      // Fallback: use hash as CID for demo
      onSubmit(challenge.id, `demo_${Date.now()}`);
    }
    setUploading(false);
  };

  return (
    <div className="ag-modal-overlay" onClick={onClose}>
      <div className="ag-modal" onClick={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: 3, color: "#FF3CAC", marginBottom: 8 }}>
          SUBMIT YOUR IDEA
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 20, lineHeight: 1.2 }}>
          {challenge.title}
        </h2>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 16 }}>
          REWARD: +{challenge.xpReward.toString()} XP · {Number(challenge.multiplier) / 100}x multiplier
        </p>
        <textarea
          className="ag-input"
          rows={6}
          placeholder="Your innovation idea..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <button className="ag-btn" style={{ flex: 1 }} onClick={handleSubmit} disabled={uploading || !text.trim()}>
            {uploading ? "UPLOADING..." : "SUBMIT TO CHAIN"}
          </button>
          <button className="ag-btn magenta" onClick={onClose}>CANCEL</button>
        </div>
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>
          Your idea will be stored on IPFS. The IPFS CID is written to Polygon Mumbai.
        </p>
      </div>
    </div>
  );
}

// ─── Vote Modal ───────────────────────────────────────────────────────────────
function VoteModal({
  proposal, onClose, onVote
}: {
  proposal: Proposal;
  onClose: () => void;
  onVote: (proposalId: bigint, support: boolean, amount: bigint) => void;
}) {
  const [amount, setAmount] = useState("5");
  const power = Math.floor(Math.sqrt(parseFloat(amount) || 0));

  return (
    <div className="ag-modal-overlay" onClick={onClose}>
      <div className="ag-modal" onClick={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: 3, color: "#FF3CAC", marginBottom: 8 }}>
          CAST YOUR VOTE
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 12, lineHeight: 1.2 }}>
          {proposal.title}
        </h2>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>{proposal.description}</p>
        <label style={{ fontSize: 12, letterSpacing: 1, opacity: 0.7 }}>$INNOV TO LOCK (QUADRATIC VOTING)</label>
        <input
          className="ag-input"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        <p style={{ fontSize: 12, color: "var(--void)", opacity: 0.7, marginBottom: 20 }}>
          Locking {amount} $INNOV → voting power: <strong>{power}</strong> (quadratic)
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="ag-btn" style={{ flex: 1 }}
            onClick={() => onVote(proposal.id, true, parseEther(amount))}>
            ✓ VOTE FOR
          </button>
          <button className="ag-btn magenta" style={{ flex: 1 }}
            onClick={() => onVote(proposal.id, false, parseEther(amount))}>
            ✗ VOTE AGAINST
          </button>
        </div>
        <button className="ag-btn" style={{ width: "100%", marginTop: 8, borderColor: "rgba(4,4,10,0.3)", color: "rgba(4,4,10,0.5)" }}
          onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [submitModal, setSubmitModal] = useState<Challenge | null>(null);
  const [voteModal, setVoteModal] = useState<Proposal | null>(null);
  const [aiChallenge, setAiChallenge] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [votedProposals, setVotedProposals] = useState<Set<string>>(new Set());
  const [mockChallenges, setMockChallenges] = useState<any[]>([]);
  const [mockProposals, setMockProposals] = useState<any[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Contract reads
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.innovToken,
    abi: INNOV_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: challenges, isError: challengesError } = useReadContract({
    address: CONTRACT_ADDRESSES.challengeRewards,
    abi: CHALLENGE_REWARDS_ABI,
    functionName: "getActiveChallenges",
  });

  const { data: userProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.challengeRewards,
    abi: CHALLENGE_REWARDS_ABI,
    functionName: "getUserProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: xpData } = useReadContract({
    address: CONTRACT_ADDRESSES.challengeRewards,
    abi: CHALLENGE_REWARDS_ABI,
    functionName: "getXPForNextLevel",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: proposals, isError: proposalsError } = useReadContract({
    address: CONTRACT_ADDRESSES.governance,
    abi: GOVERNANCE_ABI,
    functionName: "getActiveProposals",
  });

  // Fetch mock data if contract reads fail
  useEffect(() => {
    if (challengesError || !challenges || (challenges as any[]).length === 0) {
      console.log("Fetching fallback challenges...");
      fetch("/api/challenges")
        .then(r => r.json())
        .then(data => {
          setMockChallenges(data.challenges || []);
          setIsDemoMode(true);
        });
    }
  }, [challenges, challengesError]);

  useEffect(() => {
    if (proposalsError || !proposals || (proposals as any[]).length === 0) {
      console.log("Fetching fallback proposals...");
      fetch("/api/governance")
        .then(r => r.json())
        .then(data => {
          setMockProposals(data.proposals || []);
          setIsDemoMode(true);
        });
    }
  }, [proposals, proposalsError]);

  // Contract writes
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      setTxStatus("✅ Transaction confirmed!");
      refetchBalance();
      refetchProfile();
      setTimeout(() => setTxStatus(""), 4000);
    }
  }, [txConfirmed]);

  // Fetch AI challenge on load
  useEffect(() => {
    fetch("/api/ai-challenge")
      .then((r) => r.json())
      .then((d) => setAiChallenge(d.challenge))
      .catch(() => setAiChallenge("Design a Web3-native loyalty system for sustainable fashion brands that rewards circular economy behavior on-chain."));
  }, []);

  // Claim welcome NFT on first connect
  useEffect(() => {
    if (isConnected && address && userProfile && !(userProfile as any).welcomeNFTClaimed && !isDemoMode) {
      writeContract({
        address: CONTRACT_ADDRESSES.challengeRewards,
        abi: CHALLENGE_REWARDS_ABI,
        functionName: "claimWelcomeNFT",
      });
    }
  }, [isConnected, address, userProfile, isDemoMode]);

  const handleSubmitIdea = (challengeId: bigint, ipfsCid: string) => {
    setSubmitModal(null);
    if (isDemoMode) {
      setTxStatus("✅ [DEMO MODE] Idea submitted successfully!");
      setTimeout(() => setTxStatus(""), 4000);
      return;
    }
    setTxStatus("⏳ Submitting idea to chain...");
    writeContract({
      address: CONTRACT_ADDRESSES.challengeRewards,
      abi: CHALLENGE_REWARDS_ABI,
      functionName: "submitIdea",
      args: [challengeId, ipfsCid],
    });
  };

  const handleVote = (proposalId: bigint, support: boolean, amount: bigint) => {
    setVoteModal(null);
    setVotedProposals((prev) => new Set([...prev, proposalId.toString()]));
    if (isDemoMode) {
      setTxStatus("✅ [DEMO MODE] Vote cast successfully!");
      setTimeout(() => setTxStatus(""), 4000);
      return;
    }
    setTxStatus("⏳ Casting vote...");
    writeContract({
      address: CONTRACT_ADDRESSES.governance,
      abi: GOVERNANCE_ABI,
      functionName: "castVote",
      args: [proposalId, support, amount],
    });
  };

  const profile = userProfile as UserProfile | undefined;
  const level = profile ? Number(profile.level) || 1 : 1;
  const xpCurrent = xpData ? Number((xpData as any)[0]) : 0;
  const xpNeeded = xpData ? Number((xpData as any)[1]) : 1000;
  const xpPct = xpNeeded > 0 ? Math.min((xpCurrent / xpNeeded) * 100, 100) : 0;
  const balanceFormatted = tokenBalance ? parseFloat(formatEther(tokenBalance as bigint)).toFixed(0) : "0";
  const streak = profile ? Number(profile.currentStreak) : 0;
  const submissionCount = profile ? Number(profile.submissionCount) : 0;

  const challengeList = (challenges as any[] | undefined) || mockChallenges;
  const proposalList = (proposals as any[] | undefined) || mockProposals;

  const getForPct = (p: any) => {
    if (p.forPct !== undefined) return p.forPct;
    const total = Number(p.forVotes) + Number(p.againstVotes);
    return total === 0 ? 50 : Math.round((Number(p.forVotes) / total) * 100);
  };

  const getDaysLeft = (deadline: any) => {
    const deadlineNum = typeof deadline === "bigint" ? Number(deadline) : Number(deadline);
    const diff = deadlineNum * 1000 - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon";
  };

  const getSubmissionCount = (ch: any) => {
    return ch.submissionCount ? ch.submissionCount.toString() : "0";
  };

  const tiltMap = ["--tilt: -2deg", "--tilt: 2.5deg", "--tilt: -1.5deg", "--tilt: 3deg"];
  const floatMap = ["float-a", "float-b", "float-c", "float-d"];

  return (
    <>
      {/* NAV */}
      <nav className="ag-nav">
        <div className="ag-nav-logo">INNOV<span>2</span>EARN</div>
        <div className="ag-nav-links">
          {["CHALLENGES", "LEADERBOARD", "GOVERNANCE", "MY NFTS"].map((l) => (
            <a key={l} className="ag-nav-link" href={`#${l.toLowerCase().replace(" ", "-")}`}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isDemoMode && (
            <div style={{ background: "rgba(200,255,0,0.1)", border: "1px solid var(--lime)", color: "var(--lime)", padding: "2px 8px", borderRadius: 4, fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-display)" }}>
              DEMO MODE
            </div>
          )}
          {isConnected && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--lime)" }}>
              {balanceFormatted} <span style={{ opacity: 0.6 }}>$INNOV</span>
            </div>
          )}
          <ConnectButton />
        </div>
      </nav>

      {/* TX STATUS BAR */}
      {txStatus && (
        <div style={{ background: "var(--lime)", color: "var(--void)", padding: "8px 32px", textAlign: "center", fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: 2 }}>
          {txStatus}
        </div>
      )}

      <div className="ag-page">
        {!isConnected ? (
          <div style={{ textAlign: "center", paddingTop: 120 }}>
            <h1 className="ag-heading" style={{ fontSize: 80, lineHeight: 1, marginBottom: 24 }}>
              PLAY<br /><span style={{ color: "var(--lime)" }}>TO</span><br />INNOVATE
            </h1>
            <p style={{ opacity: 0.5, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
              Earn $INNOV tokens by solving open innovation challenges. Vote on what gets funded. Own your ideas on-chain.
            </p>
            <ConnectButton label="CONNECT WALLET TO START" />
          </div>
        ) : (
          <>
            {/* STAT STRIP */}
            <div className="ag-grid-4" style={{ marginBottom: 40 }}>
              {[
                { label: "LEVEL", val: level, sub: LEVEL_NAMES[level] || "Innovator", tilt: 0 },
                { label: "XP THIS WEEK", val: xpCurrent.toLocaleString(), sub: `/${xpNeeded.toLocaleString()} to next`, tilt: 1 },
                { label: "SUBMISSIONS", val: submissionCount, sub: "total ideas", tilt: 2 },
                { label: "STREAK", val: `${streak}🔥`, sub: "days active", tilt: 3 },
              ].map(({ label, val, sub, tilt }) => (
                <div
                  key={label}
                  className={`ag-card ${floatMap[tilt]}`}
                  style={{ "--tilt": tiltMap[tilt].replace("--tilt: ", "") } as any}
                >
                  <div className="ag-stat-label">{label}</div>
                  <div className="ag-stat-num">{val}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* XP BAR */}
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span className="ag-heading" style={{ fontSize: 14, letterSpacing: 2, color: "var(--bone)", opacity: 0.6 }}>
                LEVEL {level} → {level + 1}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                {xpCurrent.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="xp-track" style={{ marginBottom: 8 }}>
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>

            {/* AI BANNER */}
            <div className="ag-ai-banner">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: 2, color: "var(--magenta)" }}>✦ AI DROP  </span>
              <span style={{ fontFamily: "var(--font-mono)", fontStyle: "italic", fontSize: 13 }}>{aiChallenge}</span>
            </div>

            {/* CHALLENGES */}
            <div id="challenges">
              <p className="ag-section-label">ACTIVE CHALLENGES</p>
              <div className="ag-grid-2" style={{ marginBottom: 48 }}>
                {challengeList.length === 0 ? (
                  <p style={{ opacity: 0.4, gridColumn: "span 2" }}>Loading challenges...</p>
                ) : (
                  challengeList.slice(0, 4).map((ch, i) => (
                    <div
                      key={ch.id.toString()}
                      className={`ag-card ${floatMap[i % 4]} ${i === 0 ? "featured" : ""}`}
                      style={{ "--tilt": tiltMap[i % 4].replace("--tilt: ", "") } as any}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <span className="ag-tag" style={{ color: CATEGORY_COLORS[ch.category] || "var(--lime)" }}>
                          {ch.category.toUpperCase()}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--void)", opacity: 0.7 }}>
                          +{ch.xpReward.toString()} XP · {Number(ch.multiplier) / 100}x
                        </span>
                      </div>
                      <h3 className="ag-heading" style={{ fontSize: 20, marginBottom: 12, lineHeight: 1.2, color: "var(--void)" }}>
                        {ch.title}
                      </h3>
                      <div style={{ display: "flex", gap: 16, fontSize: 11, opacity: 0.6, marginBottom: 16, fontFamily: "var(--font-mono)", color: "var(--void)" }}>
                        <span>{getDaysLeft(ch.deadline)}</span>
                        <span>·</span>
                        <span>{getSubmissionCount(ch)} submissions</span>
                        <span>·</span>
                        <span>{ch.difficulty.toUpperCase()}</span>
                      </div>
                      <button
                        className="ag-btn"
                        style={{ width: "100%", fontSize: 16 }}
                        onClick={() => setSubmitModal(ch)}
                        disabled={isPending}
                      >
                        SUBMIT IDEA →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LEADERBOARD + GOVERNANCE */}
            <div className="ag-grid-2" style={{ marginBottom: 48 }}>
              {/* LEADERBOARD */}
              <div id="leaderboard">
                <p className="ag-section-label">LEADERBOARD</p>
                <div className="ag-card dark" style={{ transform: "rotate(-1deg)", padding: "24px" }}>
                  {[
                    { rank: 1, name: "nebulabuilder.eth", tokens: "1,840", level: 18, isYou: false },
                    { rank: 2, name: "0xproto", tokens: "1,430", level: 15, isYou: false },
                    { rank: 3, name: "crvdao.lens", tokens: "1,140", level: 12, isYou: false },
                    { rank: 4, name: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "you", tokens: balanceFormatted, level, isYou: true },
                  ].map(({ rank, name, tokens, level: lvl, isYou }) => (
                    <div key={rank} style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "12px 0", position: "relative", overflow: "hidden",
                      borderBottom: "1px solid rgba(200,255,0,0.1)",
                      borderLeft: isYou ? "2px solid var(--lime)" : "none",
                      paddingLeft: isYou ? 12 : 0,
                    }}>
                      <span className="lb-ghost">{rank}</span>
                      <span className="ag-heading" style={{ fontSize: 32, color: "var(--lime)", width: 48, position: "relative", zIndex: 1 }}>
                        {rank}
                      </span>
                      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                        <div className="ag-heading" style={{ fontSize: 18, color: "var(--bone)" }}>{name}</div>
                        <div style={{ fontSize: 11, opacity: 0.5 }}>{LEVEL_NAMES[lvl] || "Innovator"} · LVL {lvl}</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", color: "var(--lime)", fontWeight: 600, position: "relative", zIndex: 1 }}>
                        {tokens} <span style={{ opacity: 0.5, fontSize: 11 }}>$INNOV</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GOVERNANCE */}
              <div id="governance">
                <p className="ag-section-label">GOVERNANCE VOTES</p>
                {proposalList.length === 0 ? (
                  <p style={{ opacity: 0.4 }}>Loading proposals...</p>
                ) : (
                  proposalList.map((p) => {
                    const forPct = getForPct(p);
                    const hasVoted = votedProposals.has(p.id.toString());
                    return (
                      <div key={p.id.toString()} className="ag-card dark"
                        style={{ marginBottom: 16, transform: `rotate(${Number(p.id) % 2 === 0 ? "1.5deg" : "-1deg"})` }}>
                        <h4 className="ag-heading" style={{ fontSize: 18, marginBottom: 12, color: "var(--bone)" }}>
                          {p.title}
                        </h4>
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, color: "var(--lime)", lineHeight: 1 }}>
                            {forPct}%
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.5 }}>in favor</div>
                        </div>
                        <div className="xp-track" style={{ height: 4, marginBottom: 12 }}>
                          <div style={{ width: `${forPct}%`, height: "100%", background: forPct > 50 ? "var(--lime)" : "var(--magenta)" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, opacity: 0.5 }}>{getDaysLeft(p.deadline)}</span>
                          <button
                            className={`ag-btn magenta ${hasVoted ? "voted" : ""}`}
                            style={{ fontSize: 14 }}
                            onClick={() => !hasVoted && setVoteModal(p)}
                            disabled={hasVoted}
                          >
                            {hasVoted ? "✓ VOTED" : "VOTE $INNOV"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {submitModal && (
        <SubmitModal challenge={submitModal} onClose={() => setSubmitModal(null)} onSubmit={handleSubmitIdea} />
      )}
      {voteModal && (
        <VoteModal proposal={voteModal} onClose={() => setVoteModal(null)} onVote={handleVote} />
      )}
    </>
  );
}

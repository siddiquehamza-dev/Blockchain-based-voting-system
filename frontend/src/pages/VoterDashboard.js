// src/pages/VoterDashboard.js — Voter interface

import React, { useState, useEffect, useCallback } from "react";
import { toast }    from "react-toastify";
import Navbar       from "../components/Navbar";
import { useAuth }  from "../context/AuthContext";
import { useWeb3 }  from "../context/Web3Context";
import { voterAPI } from "../utils/api";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "./VoterDashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = ["#6c63ff", "#00d9a3", "#ffa94d", "#ff4d6d", "#40c057", "#74c0fc"];

const VoterDashboard = () => {
  const { user, updateUser }                           = useAuth();
  const { contract, account, connectWallet, connecting } = useWeb3();

  // ── State ────────────────────────────────────────────────────────────
  const [electionInfo, setElectionInfo] = useState(null);
  const [candidates,   setCandidates]   = useState([]);
  const [totalVotes,   setTotalVotes]   = useState(0);
  const [hasVoted,     setHasVoted]     = useState(false);
  const [txHash,       setTxHash]       = useState("");
  const [votingFor,    setVotingFor]    = useState(null);
  const [txLoading,    setTxLoading]    = useState(false);
  const [walletInput,  setWalletInput]  = useState("");
  const [updatingWallet, setUpdatingWallet] = useState(false);

  // ── Fetch blockchain data ─────────────────────────────────────────────
  const fetchBlockchainData = useCallback(async () => {
    if (!contract) return;
    try {
      const info     = await contract.getElectionInfo();
      const allCands = await contract.getAllCandidates();
      const votes    = await contract.totalVotes();

      setElectionInfo({
        name:     info[0],
        isActive: info[1],
        numCands: Number(info[2]),
        votes:    Number(info[3]),
      });
      setCandidates(
        allCands.map((c) => ({
          id:        Number(c.id),
          name:      c.name,
          party:     c.party,
          voteCount: Number(c.voteCount),
        }))
      );
      setTotalVotes(Number(votes));

      // Check if this wallet has already voted
      if (account) {
        const voted = await contract.checkIfVoted(account);
        setHasVoted(voted);
      }
    } catch (err) {
      console.error("Blockchain fetch error:", err.message);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract) fetchBlockchainData();
  }, [contract, fetchBlockchainData]);

  // ── Cast Vote ─────────────────────────────────────────────────────────
  const handleVote = async (candidateId) => {
    if (!contract)   return toast.error("Connect MetaMask first!");
    if (!user.isApproved) return toast.error("Your account is not approved yet. Wait for admin.");
    if (hasVoted)    return toast.error("You have already voted!");

    setVotingFor(candidateId);
    setTxLoading(true);
    try {
      const tx = await contract.vote(candidateId);
      toast.info("⏳ Submitting your vote to blockchain...");
      const receipt = await tx.wait();

      setTxHash(receipt.hash);
      setHasVoted(true);
      toast.success("🎉 Vote cast successfully! Transaction recorded on blockchain.");
      fetchBlockchainData(); // Refresh results
    } catch (err) {
      const msg = err.reason || err.message || "Transaction failed.";
      toast.error(`Vote failed: ${msg}`);
    } finally {
      setTxLoading(false);
      setVotingFor(null);
    }
  };

  // ── Update wallet address ─────────────────────────────────────────────
  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    const addr = walletInput.trim() || account;
    if (!addr) return toast.error("Connect MetaMask or enter wallet address.");

    setUpdatingWallet(true);
    try {
      await voterAPI.updateWallet(addr);
      updateUser({ walletAddress: addr });
      toast.success("Wallet address updated!");
      setWalletInput("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wallet.");
    } finally {
      setUpdatingWallet(false);
    }
  };

  // ── Bar chart data ────────────────────────────────────────────────────
  const chartData = {
    labels: candidates.map((c) => c.name),
    datasets: [{
      label:           "Votes",
      data:            candidates.map((c) => c.voteCount),
      backgroundColor: COLORS.slice(0, candidates.length),
      borderRadius:    6,
      borderSkipped:   false,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: "#9090b8" }, grid: { color: "rgba(255,255,255,0.04)" } },
      y: {
        ticks:       { color: "#9090b8", stepSize: 1 },
        grid:        { color: "rgba(255,255,255,0.04)" },
        beginAtZero: true,
      },
    },
  };

  // ════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="voter-page">
      <Navbar />

      <div className="container">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1>🗳️ Voter Dashboard</h1>
              <p>Welcome, <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong>!</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {!account && (
                <button className="btn btn-primary" onClick={connectWallet} disabled={connecting}>
                  🦊 {connecting ? "Connecting..." : "Connect MetaMask"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Cards ────────────────────────────────────────── */}
        <div className="voter-status-bar">
          <div className={`status-chip ${user.isApproved ? "approved" : "pending"}`}>
            {user.isApproved ? "✅ Account Approved" : "⏳ Awaiting Approval"}
          </div>
          <div className={`status-chip ${account ? "approved" : "pending"}`}>
            {account
              ? `🦊 ${account.slice(0, 6)}...${account.slice(-4)}`
              : "🦊 Wallet Not Connected"}
          </div>
          <div className={`status-chip ${hasVoted ? "voted" : "not-voted"}`}>
            {hasVoted ? "✅ You Have Voted" : "⬜ Not Voted Yet"}
          </div>
          <div className={`status-chip ${electionInfo?.isActive ? "approved" : "pending"}`}>
            {electionInfo?.isActive ? "🟢 Voting Open" : "🔴 Voting Closed"}
          </div>
        </div>

        {/* ── Not Approved Warning ────────────────────────────────── */}
        {!user.isApproved && (
          <div className="alert alert-warning">
            ⚠️ Your voter registration is pending admin approval. You can view
            election info but cannot vote until approved.
          </div>
        )}

        {/* ── Wallet Setup (if not set) ────────────────────────────── */}
        {!user.walletAddress && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <h3 style={{ marginBottom: "12px" }}>🦊 Link Your Wallet</h3>
            <p style={{ marginBottom: "16px", fontSize: "0.88rem" }}>
              Link your MetaMask wallet address so the admin can verify your identity.
            </p>
            <form onSubmit={handleUpdateWallet} style={{ display: "flex", gap: "10px" }}>
              <input
                className="form-input"
                type="text"
                placeholder="0x... or connect MetaMask above"
                value={walletInput || account || ""}
                onChange={(e) => setWalletInput(e.target.value)}
                style={{
                  flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
                  borderRadius: "8px", color: "var(--text-primary)", padding: "10px 14px",
                  fontFamily: "inherit",
                }}
              />
              <button
                id="save-wallet-btn"
                type="submit"
                className="btn btn-primary"
                disabled={updatingWallet}
              >
                {updatingWallet ? "Saving..." : "Save Wallet"}
              </button>
            </form>
          </div>
        )}

        {/* ── Election Info Banner ─────────────────────────────────── */}
        {electionInfo?.name ? (
          <div className="election-info-card">
            <div>
              <div className="election-title">📊 {electionInfo.name}</div>
              <div className="election-meta">
                {electionInfo.numCands} candidates · {totalVotes} total votes
              </div>
            </div>
            <span className={`badge ${electionInfo.isActive ? "badge-success" : "badge-muted"}`}>
              {electionInfo.isActive ? "🟢 OPEN" : "🔴 CLOSED"}
            </span>
          </div>
        ) : (
          <div className="alert alert-info">
            ℹ️ No election has been created yet. Check back later.
          </div>
        )}

        <div className="voter-grid">
          {/* ── LEFT: Candidates + Voting ───────────────────────────── */}
          <div>
            <div className="card">
              <h3 style={{ marginBottom: "16px" }}>🏅 Candidates</h3>

              {candidates.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  No candidates added yet
                </div>
              ) : (
                <div className="candidate-cards">
                  {candidates.map((c, i) => (
                    <div key={c.id} className={`vote-card ${hasVoted ? "voted-state" : ""}`}>
                      <div className="vote-card-left">
                        <div
                          className="cand-avatar"
                          style={{ background: COLORS[i % COLORS.length] + "22",
                                   color: COLORS[i % COLORS.length] }}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="cand-name">{c.name}</div>
                          <div className="cand-party">{c.party || "Independent"}</div>
                        </div>
                      </div>
                      <div className="vote-card-right">
                        <div className="cand-vote-count">{c.voteCount}</div>
                        <button
                          id={`vote-btn-${c.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVote(c.id)}
                          disabled={
                            txLoading         ||
                            hasVoted          ||
                            !account          ||
                            !user.isApproved  ||
                            !electionInfo?.isActive
                          }
                        >
                          {txLoading && votingFor === c.id
                            ? "⏳ Voting..."
                            : hasVoted
                            ? "✅ Voted"
                            : "Vote"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Vote Receipt ──────────────────────────────────────── */}
            {txHash && (
              <div className="receipt-card">
                <h4>🧾 Vote Receipt</h4>
                <p style={{ fontSize: "0.82rem", margin: "8px 0 4px" }}>Transaction Hash:</p>
                <div className="tx-hash">{txHash}</div>
                <p style={{ fontSize: "0.78rem", marginTop: "8px", color: "var(--text-muted)" }}>
                  Your vote is permanently recorded on the Ethereum blockchain.
                  Save this hash as proof.
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Live Results Chart ────────────────────────────── */}
          <div>
            <div className="card">
              <h3 style={{ marginBottom: "16px" }}>📈 Live Results</h3>
              {candidates.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  Results will appear here
                </div>
              )}
              <button
                className="btn btn-outline btn-sm btn-full"
                style={{ marginTop: "16px" }}
                onClick={fetchBlockchainData}
              >
                🔄 Refresh Results
              </button>
            </div>

            {/* ── How Voting Works ─────────────────────────────────── */}
            <div className="card" style={{ marginTop: "16px" }}>
              <h4 style={{ marginBottom: "12px" }}>🔐 How Your Vote is Protected</h4>
              <div className="how-it-works">
                <div className="step">
                  <span className="step-no">1</span>
                  <span>You click Vote → MetaMask asks confirmation</span>
                </div>
                <div className="step">
                  <span className="step-no">2</span>
                  <span>Transaction sent to Ethereum blockchain</span>
                </div>
                <div className="step">
                  <span className="step-no">3</span>
                  <span>Smart contract checks: have you voted before?</span>
                </div>
                <div className="step">
                  <span className="step-no">4</span>
                  <span>If not → vote recorded. If yes → rejected.</span>
                </div>
                <div className="step">
                  <span className="step-no">5</span>
                  <span>Only candidate ID stored — NOT your identity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterDashboard;

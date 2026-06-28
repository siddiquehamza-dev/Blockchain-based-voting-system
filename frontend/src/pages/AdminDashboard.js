// src/pages/AdminDashboard.js — Full admin control panel

// ── All imports MUST be at the top ──────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
import { toast }        from "react-toastify";
import Navbar           from "../components/Navbar";
import { useWeb3 }      from "../context/Web3Context";
import { voterAPI, electionAPI } from "../utils/api";
import { CONTRACT_ADDRESS }       from "../utils/config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "./AdminDashboard.css";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Shared colors for charts and avatars
const COLORS = ["#6c63ff", "#00d9a3", "#ffa94d", "#ff4d6d", "#40c057", "#74c0fc"];

// ── Sub-component: Stat Card ─────────────────────────────────────────────
const StatCard = ({ number, label, color }) => (
  <div className="stat-card">
    <div className="stat-number" style={{ color }}>{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ── Sub-component: Results Tab ───────────────────────────────────────────
const ResultsTab = ({ candidates, totalVotes }) => {
  if (candidates.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          No election data available yet. Create an election and add candidates.
        </div>
      </div>
    );
  }

  const winner = [...candidates].sort((a, b) => b.voteCount - a.voteCount)[0];

  const barData = {
    labels: candidates.map((c) => c.name),
    datasets: [{
      label:           "Votes",
      data:            candidates.map((c) => c.voteCount),
      backgroundColor: COLORS.slice(0, candidates.length),
      borderRadius:    8,
      borderSkipped:   false,
    }],
  };

  const doughnutData = {
    labels: candidates.map((c) => `${c.name} (${c.party})`),
    datasets: [{
      data:            candidates.map((c) => c.voteCount || 0.001),
      backgroundColor: COLORS.slice(0, candidates.length),
      borderWidth:     2,
      borderColor:     "var(--bg-card)",
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#9090b8", font: { family: "Inter" } } },
      title:  { display: false },
    },
    scales: {
      x: { ticks: { color: "#9090b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
      y: {
        ticks: { color: "#9090b8", stepSize: 1 },
        grid:  { color: "rgba(255,255,255,0.05)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      {/* Winner banner */}
      {totalVotes > 0 && (
        <div className="winner-banner">
          🏆 <strong>Leading:</strong> {winner.name} ({winner.party}) with{" "}
          {winner.voteCount} vote{winner.voteCount !== 1 ? "s" : ""}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "20px" }}>
        {/* Bar chart */}
        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>📊 Vote Count</h3>
          <Bar data={barData} options={chartOptions} />
        </div>

        {/* Doughnut chart */}
        <div className="card">
          <h3 style={{ marginBottom: "16px" }}>🥧 Distribution</h3>
          <Doughnut
            data={doughnutData}
            options={{ responsive: true, plugins: { legend: { labels: { color: "#9090b8" } } } }}
          />
        </div>
      </div>

      {/* Results table */}
      <div className="card">
        <h3 style={{ marginBottom: "16px" }}>📋 Detailed Results (Total: {totalVotes} votes)</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Party</th>
                <th>Votes</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {[...candidates]
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td><strong style={{ color: "var(--text-primary)" }}>{c.name}</strong></td>
                    <td>{c.party || "—"}</td>
                    <td><strong style={{ color: "var(--primary-light)" }}>{c.voteCount}</strong></td>
                    <td>
                      {totalVotes > 0
                        ? `${((c.voteCount / totalVotes) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (main component)
// ═══════════════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { contract, account, connectWallet, connecting } = useWeb3();

  // ── State ─────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]   = useState("overview");
  const [voters,       setVoters]      = useState([]);
  const [stats,        setStats]       = useState({ totalVoters: 0, approvedVoters: 0, pendingVoters: 0 });
  const [electionInfo, setElectionInfo] = useState(null);
  const [dbElection,   setDbElection]  = useState(null);
  const [candidates,   setCandidates]  = useState([]);
  const [totalVotes,   setTotalVotes]  = useState(0);
  const [electionName, setElectionName] = useState("");
  const [electionDesc, setElectionDesc] = useState("");
  const [candName,     setCandName]    = useState("");
  const [candParty,    setCandParty]   = useState("");
  const [txLoading,    setTxLoading]   = useState(false);

  // ── Fetch voter stats from backend ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, votersRes] = await Promise.all([
        voterAPI.getStats(),
        voterAPI.getAllVoters(),
      ]);
      setStats(statsRes.data);
      setVoters(votersRes.data.voters);
    } catch (err) {
      console.error("Error fetching stats:", err.message);
    }
  }, []);

  // ── Fetch election info from blockchain ─────────────────────────────
  const fetchBlockchainInfo = useCallback(async () => {
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
      setCandidates(allCands.map((c) => ({
        id:        Number(c.id),
        name:      c.name,
        party:     c.party,
        voteCount: Number(c.voteCount),
      })));
      setTotalVotes(Number(votes));
    } catch (err) {
      console.error("Error fetching blockchain info:", err.message);
    }
  }, [contract]);

  // ── Fetch current election from backend ─────────────────────────────
  const fetchDbElection = useCallback(async () => {
    try {
      const res = await electionAPI.getCurrent();
      setDbElection(res.data.election);
    } catch (_) {
      setDbElection(null);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDbElection();
  }, [fetchStats, fetchDbElection]);

  useEffect(() => {
    if (contract) fetchBlockchainInfo();
  }, [contract, fetchBlockchainInfo]);

  // ── Approve voter ──────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await voterAPI.approveVoter(id);
      toast.success("Voter approved ✅");
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve voter.");
    }
  };

  // ── Reject voter ───────────────────────────────────────────────────
  const handleReject = async (id) => {
    try {
      await voterAPI.rejectVoter(id);
      toast.info("Voter rejected.");
      fetchStats();
    } catch (err) {
      toast.error("Failed to reject voter.");
    }
  };

  // ── Create election (on-chain + DB) ───────────────────────────────
  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect MetaMask first!");
    if (!electionName.trim()) return toast.error("Enter election name.");

    setTxLoading(true);
    try {
      const tx = await contract.createElection(electionName);
      toast.info("⏳ Creating election on blockchain...");
      await tx.wait();

      await electionAPI.create({
        name:            electionName,
        description:     electionDesc,
        contractAddress: CONTRACT_ADDRESS,
      });

      toast.success("🎉 Election created on blockchain + saved to DB!");
      setElectionName("");
      setElectionDesc("");
      fetchBlockchainInfo();
      fetchDbElection();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  // ── Add candidate (on-chain) ───────────────────────────────────────
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect MetaMask first!");
    if (!candName.trim()) return toast.error("Enter candidate name.");

    setTxLoading(true);
    try {
      const tx = await contract.addCandidate(candName, candParty);
      toast.info("⏳ Adding candidate to blockchain...");
      await tx.wait();

      toast.success(`Candidate "${candName}" added!`);
      setCandName("");
      setCandParty("");
      fetchBlockchainInfo();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  // ── Start voting ───────────────────────────────────────────────────
  const handleStartVoting = async () => {
    if (!contract) return toast.error("Connect MetaMask first!");
    setTxLoading(true);
    try {
      const tx = await contract.startVoting();
      toast.info("⏳ Starting voting...");
      await tx.wait();

      if (dbElection) {
        await electionAPI.updateStatus(dbElection._id, "active");
        fetchDbElection();
      }
      toast.success("🗳️ Voting is now OPEN!");
      fetchBlockchainInfo();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  // ── End voting ─────────────────────────────────────────────────────
  const handleEndVoting = async () => {
    if (!contract) return toast.error("Connect MetaMask first!");
    setTxLoading(true);
    try {
      const tx = await contract.endVoting();
      toast.info("⏳ Ending voting...");
      await tx.wait();

      if (dbElection) {
        await electionAPI.updateStatus(dbElection._id, "ended");
        fetchDbElection();
      }
      toast.success("🔒 Voting has ended!");
      fetchBlockchainInfo();
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed.");
    } finally {
      setTxLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="container">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1>⚙️ Admin Dashboard</h1>
              <p>Manage voters, elections, and blockchain interactions</p>
            </div>
            {!account && (
              <button className="btn btn-primary" onClick={connectWallet} disabled={connecting}>
                🦊 {connecting ? "Connecting..." : "Connect MetaMask"}
              </button>
            )}
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: "28px" }}>
          <StatCard number={stats.totalVoters}   label="Total Voters" color="var(--primary-light)" />
          <StatCard number={stats.approvedVoters} label="Approved"     color="var(--success)"       />
          <StatCard number={stats.pendingVoters}  label="Pending"      color="var(--warning)"       />
          <StatCard number={totalVotes}           label="Votes Cast"   color="var(--secondary)"     />
        </div>

        {/* ── Election Status Banner ────────────────────────────── */}
        {electionInfo && electionInfo.name && (
          <div className={`election-banner ${electionInfo.isActive ? "active" : "inactive"}`}>
            <div>
              <strong>📊 Current Election:</strong> {electionInfo.name}
            </div>
            <span className={`badge ${electionInfo.isActive ? "badge-success" : "badge-muted"}`}>
              {electionInfo.isActive ? "🟢 VOTING OPEN" : "🔴 VOTING CLOSED"}
            </span>
          </div>
        )}

        {/* ── Tab Navigation ────────────────────────────────────── */}
        <div className="tabs">
          {["overview", "voters", "election", "results"].map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "overview"  && "📊 Overview"}
              {tab === "voters"    && `👥 Voters${stats.pendingVoters > 0 ? ` (${stats.pendingVoters} pending)` : ""}`}
              {tab === "election"  && "🗳️ Election Control"}
              {tab === "results"   && "🏆 Results"}
            </button>
          ))}
        </div>

        {/* ══ TAB: OVERVIEW ══════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginBottom: "16px" }}>🏅 Candidates</h3>
                {candidates.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    No candidates added yet
                  </div>
                ) : (
                  <div className="candidate-list">
                    {candidates.map((c) => (
                      <div key={c.id} className="candidate-item">
                        <div className="cand-info">
                          <strong>{c.name}</strong>
                          <span className="badge badge-primary">{c.party}</span>
                        </div>
                        <div className="cand-votes">
                          <strong>{c.voteCount}</strong>
                          <span>votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ marginBottom: "16px" }}>⚡ Quick Actions</h3>
                <div className="quick-actions">
                  <button className="btn btn-secondary btn-full" onClick={() => setActiveTab("election")}>
                    ➕ Create Election
                  </button>
                  <button className="btn btn-outline btn-full" onClick={() => setActiveTab("voters")}>
                    👥 Manage Voters
                  </button>
                  <button className="btn btn-outline btn-full" onClick={() => setActiveTab("results")}>
                    🏆 View Results
                  </button>
                  <button className="btn btn-outline btn-full" onClick={fetchBlockchainInfo}>
                    🔄 Refresh Blockchain Data
                  </button>
                </div>
                <hr className="divider" />
                {electionInfo?.isActive ? (
                  <button className="btn btn-danger btn-full" onClick={handleEndVoting} disabled={txLoading}>
                    🔒 End Voting
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleStartVoting}
                    disabled={txLoading || !electionInfo?.name}
                  >
                    🟢 Start Voting
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: VOTERS ════════════════════════════════════════ */}
        {activeTab === "voters" && (
          <div className="tab-content">
            <div className="card">
              <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                <h3>👥 Registered Voters</h3>
                <button className="btn btn-outline btn-sm" onClick={fetchStats}>🔄 Refresh</button>
              </div>
              {voters.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👤</span>
                  No voters have registered yet
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th><th>Email</th><th>National ID</th>
                        <th>Wallet</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((v) => (
                        <tr key={v._id}>
                          <td><strong style={{ color: "var(--text-primary)" }}>{v.name}</strong></td>
                          <td>{v.email}</td>
                          <td>{v.nationalId || "—"}</td>
                          <td className="wallet-addr">
                            {v.walletAddress
                              ? `${v.walletAddress.slice(0, 8)}...${v.walletAddress.slice(-4)}`
                              : "—"}
                          </td>
                          <td>
                            <span className={`badge ${v.isApproved ? "badge-success" : "badge-warning"}`}>
                              {v.isApproved ? "Approved" : "Pending"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {!v.isApproved ? (
                                <button id={`approve-${v._id}`} className="btn btn-secondary btn-sm"
                                  onClick={() => handleApprove(v._id)}>Approve</button>
                              ) : (
                                <button id={`reject-${v._id}`} className="btn btn-danger btn-sm"
                                  onClick={() => handleReject(v._id)}>Revoke</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: ELECTION CONTROL ══════════════════════════════ */}
        {activeTab === "election" && (
          <div className="tab-content">
            <div className="grid-2">
              <div className="card">
                <h3 style={{ marginBottom: "16px" }}>📝 Create Election</h3>
                <div className="alert alert-info">
                  This sends a transaction to the smart contract. Confirm in MetaMask.
                </div>
                <form onSubmit={handleCreateElection}>
                  <div className="form-group">
                    <label>Election Name</label>
                    <input id="election-name-input" type="text"
                      placeholder="e.g. Student Union Election 2024"
                      value={electionName} onChange={(e) => setElectionName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Description (optional)</label>
                    <input id="election-desc-input" type="text"
                      placeholder="Brief description..."
                      value={electionDesc} onChange={(e) => setElectionDesc(e.target.value)} />
                  </div>
                  <button id="create-election-btn" type="submit"
                    className="btn btn-primary btn-full"
                    disabled={txLoading || !account}>
                    {txLoading ? "⏳ Processing..." : "Create Election on Blockchain"}
                  </button>
                </form>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: "16px" }}>👤 Add Candidate</h3>
                <div className="alert alert-info">
                  Add candidates BEFORE starting the voting period.
                </div>
                <form onSubmit={handleAddCandidate}>
                  <div className="form-group">
                    <label>Candidate Name</label>
                    <input id="cand-name-input" type="text"
                      placeholder="e.g. Alice Johnson"
                      value={candName} onChange={(e) => setCandName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Party / Group</label>
                    <input id="cand-party-input" type="text"
                      placeholder="e.g. Progressive Party"
                      value={candParty} onChange={(e) => setCandParty(e.target.value)} />
                  </div>
                  <button id="add-candidate-btn" type="submit"
                    className="btn btn-secondary btn-full"
                    disabled={txLoading || !account || !electionInfo?.name}>
                    {txLoading ? "⏳ Processing..." : "Add Candidate"}
                  </button>
                </form>
              </div>
            </div>

            <div className="card" style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "16px" }}>🎮 Voting Control</h3>
              <div className="voting-controls">
                <button id="start-voting-btn" className="btn btn-primary btn-lg"
                  onClick={handleStartVoting}
                  disabled={txLoading || !account || electionInfo?.isActive || !electionInfo?.name}>
                  🟢 Start Voting
                </button>
                <button id="end-voting-btn" className="btn btn-danger btn-lg"
                  onClick={handleEndVoting}
                  disabled={txLoading || !account || !electionInfo?.isActive}>
                  🔒 End Voting
                </button>
              </div>
              {!account && (
                <div className="alert alert-warning" style={{ marginTop: "16px" }}>
                  ⚠️ Connect MetaMask (Account #0 — the deployer) to manage elections.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: RESULTS ═══════════════════════════════════════ */}
        {activeTab === "results" && (
          <div className="tab-content">
            <ResultsTab candidates={candidates} totalVotes={totalVotes} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

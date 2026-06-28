// src/components/Navbar.js — Top navigation bar

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout }                          = useAuth();
  const { account, connectWallet, disconnectWallet, connecting } = useWeb3();

  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🗳️</span>
        <span className="navbar-title">BlockVote</span>
        <span className="navbar-subtitle">Blockchain Voting System</span>
      </div>

      <div className="navbar-right">
        {/* MetaMask connection button */}
        {account ? (
          <button
            className="wallet-btn connected"
            onClick={disconnectWallet}
            title="Click to disconnect"
          >
            <span className="wallet-dot" />
            {shortAddress(account)}
          </button>
        ) : (
          <button
            className="wallet-btn"
            onClick={connectWallet}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "🦊 Connect MetaMask"}
          </button>
        )}

        {/* User info & logout */}
        {user && (
          <div className="navbar-user">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className={`user-role ${user.role}`}>{user.role}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

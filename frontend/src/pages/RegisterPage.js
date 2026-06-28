// src/pages/RegisterPage.js

import React, { useState } from "react";
import { Link }             from "react-router-dom";
import { toast }            from "react-toastify";
import { useAuth }          from "../context/AuthContext";
import { useWeb3 }          from "../context/Web3Context";
import "./AuthPages.css";

const RegisterPage = () => {
  const { register }                   = useAuth();
  const { account, connectWallet }     = useWeb3();

  const [formData, setFormData] = useState({
    name:          "",
    email:         "",
    password:      "",
    confirmPassword: "",
    nationalId:    "",
    walletAddress: "",
  });

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Auto-fill wallet address from MetaMask
  const handleConnectWallet = async () => {
    try {
      const addr = await connectWallet();
      if (addr) {
        setFormData({ ...formData, walletAddress: addr });
        toast.success("Wallet connected! Address auto-filled.");
      }
    } catch (err) {
      toast.error("Could not connect MetaMask.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      await register({
        name:          formData.name,
        email:         formData.email,
        password:      formData.password,
        nationalId:    formData.nationalId,
        walletAddress: formData.walletAddress || account,
      });
      setSuccess(true);
      toast.success("Registration successful! Wait for admin approval.");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Show success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
          <h2>Registration Submitted!</h2>
          <p style={{ margin: "12px 0 24px" }}>
            Your account has been created. Please wait for the admin to
            approve your registration before you can vote.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div className="auth-header">
          <span className="auth-logo">📋</span>
          <h1>Voter Registration</h1>
          <p>Create your account to participate in elections</p>
        </div>

        {error   && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name" type="text" name="name"
              placeholder="John Doe"
              value={formData.name} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email" type="email" name="email"
              placeholder="you@example.com"
              value={formData.email} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nationalId">National / Student ID</label>
            <input
              id="nationalId" type="text" name="nationalId"
              placeholder="e.g. NIC or Student Roll No."
              value={formData.nationalId} onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>MetaMask Wallet Address</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="walletAddress" type="text" name="walletAddress"
                placeholder="0x... (connect MetaMask or paste)"
                value={formData.walletAddress || account || ""}
                onChange={handleChange}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleConnectWallet}
                style={{ whiteSpace: "nowrap" }}
              >
                🦊 Connect
              </button>
            </div>
          </div>

          <hr className="divider" />

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password" type="password" name="password"
              placeholder="Min. 6 characters"
              value={formData.password} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword" type="password" name="confirmPassword"
              placeholder="Repeat your password"
              value={formData.confirmPassword} onChange={handleChange} required
            />
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Registering..." : "Create Account →"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

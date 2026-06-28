// src/pages/LoginPage.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast }             from "react-toastify";
import { useAuth }           from "../context/AuthContext";
import "./AuthPages.css";

const LoginPage = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      // Redirect based on role
      navigate(user.role === "admin" ? "/admin" : "/voter", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <span className="auth-logo">🗳️</span>
          <h1>BlockVote</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        {/* Error message */}
        {error && <div className="auth-error">⚠️ {error}</div>}

        {/* Quick-fill hint for demo */}
        <div className="auth-info-box">
          <strong>Demo Admin:</strong> admin@voting.com / Admin@123<br />
          <strong>Note:</strong> Run <code>node scripts/seedAdmin.js</code> in backend first.
        </div>

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Footer link */}
        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Register as Voter</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

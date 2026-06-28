// src/context/AuthContext.js
// Manages login state, user info, and auth across the app

import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);   // Current logged-in user
  const [loading, setLoading] = useState(true);   // Initial auth check loading

  // ── On app load: restore user from localStorage ──────────────────
  useEffect(() => {
    const token      = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Optionally verify token with backend
      authAPI.getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => logout())  // Token expired/invalid
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res  = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user",  JSON.stringify(userData));
    setUser(userData);
    return userData;  // Return user so caller knows the role
  };

  // ── Register ──────────────────────────────────────────────────────
  const register = async (formData) => {
    const res = await authAPI.register(formData);
    return res.data;
  };

  // ── Logout ────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ── Update user info locally (e.g., after wallet update) ──────────
  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);

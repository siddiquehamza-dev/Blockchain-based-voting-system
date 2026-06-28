// src/App.js — Main router for the application

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import LoginPage    from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import VoterDashboard from "./pages/VoterDashboard";

// ─────────────────────────────────────────────
//  PROTECTED ROUTE — Redirect if not logged in
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If a specific role is required, check it
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/voter"} replace />;
  }

  return children;
};

// ─────────────────────────────────────────────
//  APP ROUTES
// ─────────────────────────────────────────────
function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to={user.role === "admin" ? "/admin" : "/voter"} replace />
              : <LoginPage />
          }
        />
        <Route
          path="/register"
          element={
            user
              ? <Navigate to={user.role === "admin" ? "/admin" : "/voter"} replace />
              : <RegisterPage />
          }
        />

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Voter-only route */}
        <Route
          path="/voter"
          element={
            <ProtectedRoute requiredRole="voter">
              <VoterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="*"
          element={
            user
              ? <Navigate to={user.role === "admin" ? "/admin" : "/voter"} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

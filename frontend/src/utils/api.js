// src/utils/api.js
// Axios instance with JWT auto-attach for all backend API calls

import axios from "axios";
import { API_BASE_URL } from "./config";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────
//  REQUEST INTERCEPTOR
//  Automatically attach JWT token to every request
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
//  RESPONSE INTERCEPTOR
//  Handle 401 (token expired) — redirect to login
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
//  AUTH API CALLS
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  getMe:    ()     => api.get("/auth/me"),
};

// ─────────────────────────────────────────────
//  VOTER API CALLS
// ─────────────────────────────────────────────
export const voterAPI = {
  getAllVoters:    ()              => api.get("/voters"),
  getPending:     ()              => api.get("/voters/pending"),
  approveVoter:   (id)            => api.put(`/voters/${id}/approve`),
  rejectVoter:    (id)            => api.put(`/voters/${id}/reject`),
  getStats:       ()              => api.get("/voters/stats"),
  updateWallet:   (walletAddress) => api.put("/voters/wallet", { walletAddress }),
};

// ─────────────────────────────────────────────
//  ELECTION API CALLS
// ─────────────────────────────────────────────
export const electionAPI = {
  create:        (data)           => api.post("/election", data),
  getCurrent:    ()               => api.get("/election/current"),
  getAll:        ()               => api.get("/election/all"),
  updateStatus:  (id, status)     => api.put(`/election/${id}/status`, { status }),
};

export default api;

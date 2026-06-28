// server.js — Main Express application entry point

const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const dotenv     = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();

// ─────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────

// Allow requests from React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// ─────────────────────────────────────────────
//  DATABASE CONNECTION
// ─────────────────────────────────────────────

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/voting_db")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    // Don't crash – just warn. Start MongoDB with: mongod
    console.error("❌ MongoDB connection error:", err.message);
    console.error("⚠️  Start MongoDB first:  mongod");
    console.error("    Or use Atlas:  set MONGO_URI in backend/.env");
    console.error("    Server will keep running but auth APIs will fail.\n");
  });

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

const authRoutes     = require("./routes/authRoutes");
const voterRoutes    = require("./routes/voterRoutes");
const electionRoutes = require("./routes/electionRoutes");

app.use("/api/auth",     authRoutes);     // Login, Register
app.use("/api/voters",   voterRoutes);    // Voter management
app.use("/api/election", electionRoutes); // Election metadata

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Blockchain Voting API running" });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

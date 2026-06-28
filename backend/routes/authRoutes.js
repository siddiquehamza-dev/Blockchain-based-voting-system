// routes/authRoutes.js — Login & Register endpoints

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────
//  HELPER: Generate JWT token
// ─────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // Token valid for 7 days
  );
};

// ─────────────────────────────────────────────
//  POST /api/auth/register
//  Register a new voter account
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, walletAddress, nationalId } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Check if wallet already registered
    if (walletAddress) {
      const walletExists = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
      if (walletExists) {
        return res.status(400).json({ message: "This wallet address is already registered." });
      }
    }

    // Create new voter (isApproved defaults to false)
    const user = await User.create({
      name,
      email,
      password,       // Will be hashed by pre-save hook in User model
      walletAddress:  walletAddress?.toLowerCase(),
      nationalId,
      role:           "voter",
    });

    res.status(201).json({
      message: "Registration successful! Please wait for admin approval.",
      user: {
        id:            user._id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        isApproved:    user.isApproved,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ─────────────────────────────────────────────
//  POST /api/auth/login
//  Login with email + password, receive JWT
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare password (uses bcrypt internally)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful!",
      token,
      user: {
        id:            user._id,
        name:          user.name,
        email:         user.email,
        role:          user.role,
        isApproved:    user.isApproved,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ─────────────────────────────────────────────
//  GET /api/auth/me
//  Get current logged-in user info (protected)
// ─────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({
    user: {
      id:            req.user._id,
      name:          req.user.name,
      email:         req.user.email,
      role:          req.user.role,
      isApproved:    req.user.isApproved,
      walletAddress: req.user.walletAddress,
    },
  });
});

module.exports = router;

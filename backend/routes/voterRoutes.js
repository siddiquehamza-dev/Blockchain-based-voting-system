// routes/voterRoutes.js — Voter management endpoints

const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────
//  GET /api/voters
//  Admin: Get all registered voters
// ─────────────────────────────────────────────
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    // Get all voters (not admins), sorted newest first
    const voters = await User.find({ role: "voter" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ voters, total: voters.length });
  } catch (error) {
    console.error("Get voters error:", error.message);
    res.status(500).json({ message: "Server error fetching voters." });
  }
});

// ─────────────────────────────────────────────
//  GET /api/voters/pending
//  Admin: Get voters awaiting approval
// ─────────────────────────────────────────────
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const pendingVoters = await User.find({ role: "voter", isApproved: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ voters: pendingVoters, total: pendingVoters.length });
  } catch (error) {
    console.error("Get pending voters error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  PUT /api/voters/:id/approve
//  Admin: Approve a voter registration
// ─────────────────────────────────────────────
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const voter = await User.findById(req.params.id);

    if (!voter) {
      return res.status(404).json({ message: "Voter not found." });
    }

    if (voter.role !== "voter") {
      return res.status(400).json({ message: "This user is not a voter." });
    }

    voter.isApproved = true;
    await voter.save();

    res.json({
      message: `Voter "${voter.name}" has been approved.`,
      voter: {
        id:            voter._id,
        name:          voter.name,
        email:         voter.email,
        isApproved:    voter.isApproved,
        walletAddress: voter.walletAddress,
      },
    });
  } catch (error) {
    console.error("Approve voter error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  PUT /api/voters/:id/reject
//  Admin: Reject / revoke a voter's approval
// ─────────────────────────────────────────────
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const voter = await User.findById(req.params.id);

    if (!voter) {
      return res.status(404).json({ message: "Voter not found." });
    }

    voter.isApproved = false;
    await voter.save();

    res.json({ message: `Voter "${voter.name}" has been rejected.` });
  } catch (error) {
    console.error("Reject voter error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  GET /api/voters/stats
//  Admin: Get voter statistics
// ─────────────────────────────────────────────
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalVoters    = await User.countDocuments({ role: "voter" });
    const approvedVoters = await User.countDocuments({ role: "voter", isApproved: true });
    const pendingVoters  = await User.countDocuments({ role: "voter", isApproved: false });

    res.json({ totalVoters, approvedVoters, pendingVoters });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  PUT /api/voters/wallet
//  Voter: Update their wallet address
// ─────────────────────────────────────────────
router.put("/wallet", protect, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required." });
    }

    // Check if wallet already used by someone else
    const existing = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.user._id },
    });

    if (existing) {
      return res.status(400).json({ message: "This wallet is already linked to another account." });
    }

    req.user.walletAddress = walletAddress.toLowerCase();
    await req.user.save();

    res.json({ message: "Wallet address updated successfully.", walletAddress: req.user.walletAddress });
  } catch (error) {
    console.error("Update wallet error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;

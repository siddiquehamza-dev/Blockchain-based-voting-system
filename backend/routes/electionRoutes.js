// routes/electionRoutes.js — Election metadata endpoints

const express  = require("express");
const router   = express.Router();
const Election = require("../models/Election");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────
//  POST /api/election
//  Admin: Save election metadata to MongoDB
//  (The actual contract call is done from frontend)
// ─────────────────────────────────────────────
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description, contractAddress } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Election name is required." });
    }

    // Check if there's an active election already
    const activeElection = await Election.findOne({ status: { $in: ["pending", "active"] } });
    if (activeElection) {
      return res.status(400).json({
        message: "An election is already in progress. End it before creating a new one.",
      });
    }

    const election = await Election.create({
      name,
      description,
      contractAddress: contractAddress?.toLowerCase(),
      status: "pending",
    });

    res.status(201).json({ message: "Election created successfully.", election });
  } catch (error) {
    console.error("Create election error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  GET /api/election/current
//  Public: Get the current/latest election
// ─────────────────────────────────────────────
router.get("/current", async (req, res) => {
  try {
    // Find the most recent election
    const election = await Election.findOne().sort({ createdAt: -1 });

    if (!election) {
      return res.status(404).json({ message: "No election found." });
    }

    res.json({ election });
  } catch (error) {
    console.error("Get election error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  PUT /api/election/:id/status
//  Admin: Update election status (active/ended)
// ─────────────────────────────────────────────
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "active", "ended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const election = await Election.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === "active" && { startTime: new Date() }),
        ...(status === "ended"  && { endTime:   new Date() }),
      },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({ message: "Election not found." });
    }

    res.json({ message: `Election status updated to "${status}".`, election });
  } catch (error) {
    console.error("Update election status error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─────────────────────────────────────────────
//  GET /api/election/all
//  Admin: Get all elections (history)
// ─────────────────────────────────────────────
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json({ elections, total: elections.length });
  } catch (error) {
    console.error("Get all elections error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;

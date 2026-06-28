// models/Election.js — MongoDB schema for election metadata
// NOTE: Actual votes are stored on the blockchain, NOT here.
//       This only stores non-sensitive info like election name & dates.

const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema(
  {
    // Name of the election (e.g., "Student Union Election 2024")
    name: {
      type:     String,
      required: [true, "Election name is required"],
      trim:     true,
    },

    // Brief description of what the election is about
    description: {
      type:  String,
      trim:  true,
    },

    // Current status of the election
    status: {
      type:    String,
      enum:    ["pending", "active", "ended"],
      default: "pending",
    },

    // Ethereum smart contract address for this election
    contractAddress: {
      type:      String,
      lowercase: true,
      trim:      true,
    },

    // Blockchain transaction hash when election was created on-chain
    deploymentTxHash: {
      type: String,
    },

    // When voting started and ended
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Election", ElectionSchema);

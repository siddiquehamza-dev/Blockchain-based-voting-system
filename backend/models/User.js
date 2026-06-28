// models/User.js — MongoDB schema for Admin & Voter accounts

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
    },

    // Email used for login
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // Hashed password (never store plain text!)
    password: {
      type:     String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    // Role: "admin" or "voter"
    role: {
      type:    String,
      enum:    ["admin", "voter"],
      default: "voter",
    },

    // MetaMask wallet address of the voter
    walletAddress: {
      type:      String,
      lowercase: true,
      trim:      true,
    },

    // Admin must approve voter before they can vote
    isApproved: {
      type:    Boolean,
      default: false,
    },

    // National ID or student ID (for verification)
    nationalId: {
      type:  String,
      trim:  true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─────────────────────────────────────────────
//  HOOKS (Middleware)
// ─────────────────────────────────────────────

// Hash password before saving to database
UserSchema.pre("save", async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) return next();

  // Salt rounds = 10 (good balance of security vs speed)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─────────────────────────────────────────────
//  METHODS
// ─────────────────────────────────────────────

// Compare plain text password with hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);

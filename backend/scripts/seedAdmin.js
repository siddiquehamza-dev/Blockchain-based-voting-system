// scripts/seedAdmin.js
// Run this ONCE to create the admin account in MongoDB
// Usage: node scripts/seedAdmin.js

const mongoose = require("mongoose");
const User     = require("../models/User");
require("dotenv").config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/voting_db");
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("⚠️  Admin already exists:", existing.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name:       "Admin",
      email:      "admin@voting.com",
      password:   "Admin@123",       // Will be hashed automatically
      role:       "admin",
      isApproved: true,
    });

    console.log("🎉 Admin account created successfully!");
    console.log("   Email:    admin@voting.com");
    console.log("   Password: Admin@123");
    console.log("   ⚠️  Change this password in production!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seedAdmin();

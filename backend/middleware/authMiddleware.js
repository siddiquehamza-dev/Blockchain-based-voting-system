// middleware/authMiddleware.js
// Protects routes using JWT (JSON Web Token)

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ─────────────────────────────────────────────
//  PROTECT — Verify token, attach user to req
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  // Tokens are sent in the Authorization header as "Bearer <token>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized. No token provided." });
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request (exclude password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found." });
    }

    next(); // Move to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ─────────────────────────────────────────────
//  ADMIN ONLY — Must be admin role
// ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

module.exports = { protect, adminOnly };

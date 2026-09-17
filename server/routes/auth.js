const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isActive: user.isActive,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password").populate("department", "name code");
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid email or password." });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: "Invalid email or password." });

    const token = signToken(user);
    await logAction({ userId: user._id, action: "LOGIN", entityType: "User", entityId: user._id, details: `${user.name} logged in` });

    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;

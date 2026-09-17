const express = require("express");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.get("/", protect, allowRoles("superadmin", "deptadmin"), async (req, res) => {
  const filter = {};
  if (req.user.role === "deptadmin") filter.department = req.user.department?._id;
  const users = await User.find(filter).populate("department", "name code").sort({ createdAt: -1 });
  res.json({ users });
});

router.post("/", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "A user with this email already exists." });

    const user = await User.create({ name, email: email.toLowerCase(), password, role, department: department || null });
    await logAction({ userId: req.user._id, action: "USER_CREATED", entityType: "User", entityId: user._id, details: `Created user ${user.email} (${user.role})` });
    const populated = await user.populate("department", "name code");
    res.status(201).json({ user: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user.", error: err.message });
  }
});

router.patch("/:id", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const { name, role, department, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (department !== undefined) update.department = department;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).populate("department", "name code");
    if (!user) return res.status(404).json({ message: "User not found." });

    await logAction({ userId: req.user._id, action: "USER_UPDATED", entityType: "User", entityId: user._id, details: `Updated user ${user.email}` });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user.", error: err.message });
  }
});

module.exports = router;

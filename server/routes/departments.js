const express = require("express");
const Department = require("../models/Department");
const User = require("../models/User");
const Document = require("../models/Document");
const { protect, allowRoles } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ departments });
});

router.post("/", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ message: "Name and code are required." });
    const dept = await Department.create({ name, code, description });
    await logAction({ userId: req.user._id, action: "DEPARTMENT_CREATED", entityType: "Department", entityId: dept._id, details: `Created department ${dept.name}` });
    res.status(201).json({ department: dept });
  } catch (err) {
    res.status(500).json({ message: "Failed to create department.", error: err.message });
  }
});

router.patch("/:id", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (code !== undefined) update.code = code.toUpperCase();
    if (description !== undefined) update.description = description;

    const dept = await Department.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ message: "Department not found." });

    await logAction({ userId: req.user._id, action: "DEPARTMENT_UPDATED", entityType: "Department", entityId: dept._id, details: `Updated department ${dept.name}` });
    res.json({ department: dept });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "A department with that name or code already exists." });
    res.status(500).json({ message: "Failed to update department.", error: err.message });
  }
});

router.delete("/:id", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found." });

    const [userCount, docCount] = await Promise.all([
      User.countDocuments({ department: dept._id }),
      Document.countDocuments({ department: dept._id }),
    ]);

    if (userCount > 0 || docCount > 0) {
      return res.status(400).json({
        message: `Cannot delete "${dept.name}": ${userCount} user(s) and ${docCount} document(s) still belong to it. Reassign or remove them first.`,
      });
    }

    await dept.deleteOne();
    await logAction({ userId: req.user._id, action: "DEPARTMENT_DELETED", entityType: "Department", entityId: dept._id, details: `Deleted department ${dept.name}` });
    res.json({ message: "Department deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete department.", error: err.message });
  }
});

module.exports = router;

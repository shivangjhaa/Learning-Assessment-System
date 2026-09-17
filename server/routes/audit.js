const express = require("express");
const AuditLog = require("../models/AuditLog");
const Attempt = require("../models/Attempt");
const Certificate = require("../models/Certificate");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, allowRoles("auditor", "superadmin"), async (req, res) => {
  const logs = await AuditLog.find().populate("user", "name email role").sort({ createdAt: -1 }).limit(500);
  res.json({ logs });
});

router.get("/employee/:employeeId", protect, allowRoles("auditor", "superadmin", "deptadmin"), async (req, res) => {
  const attempts = await Attempt.find({ employee: req.params.employeeId })
    .populate("document", "title category")
    .populate("documentVersion", "versionNumber")
    .sort({ createdAt: -1 });

  const certificates = await Certificate.find({ employee: req.params.employeeId })
    .populate("document", "title")
    .sort({ issuedAt: -1 });

  res.json({ attempts, certificates });
});

module.exports = router;

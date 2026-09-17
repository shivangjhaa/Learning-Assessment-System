const express = require("express");
const Certificate = require("../models/Certificate");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/my", protect, allowRoles("employee"), async (req, res) => {
  const certificates = await Certificate.find({ employee: req.user._id })
    .populate("document", "title category")
    .populate("documentVersion", "versionNumber")
    .sort({ issuedAt: -1 });
  res.json({ certificates });
});

router.get("/employee/:employeeId", protect, allowRoles("auditor", "superadmin", "deptadmin"), async (req, res) => {
  const certificates = await Certificate.find({ employee: req.params.employeeId })
    .populate("document", "title category")
    .populate("documentVersion", "versionNumber")
    .sort({ issuedAt: -1 });
  res.json({ certificates });
});

router.get("/verify/:code", protect, async (req, res) => {
  const certificate = await Certificate.findOne({ certificateCode: req.params.code })
    .populate("employee", "name email")
    .populate("document", "title category")
    .populate("documentVersion", "versionNumber");
  if (!certificate) return res.status(404).json({ message: "Certificate not found." });
  res.json({ certificate });
});

module.exports = router;

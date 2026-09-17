const express = require("express");
const User = require("../models/User");
const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Certificate = require("../models/Certificate");
const Attempt = require("../models/Attempt");
const Assignment = require("../models/Assignment");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const { role, department } = req.user;

  if (role === "superadmin") {
    const [employees, documents, pendingReviews, certificates, failedAssessments] = await Promise.all([
      User.countDocuments({ role: "employee" }),
      Document.countDocuments(),
      DocumentVersion.countDocuments({ status: "pending_approval" }),
      Certificate.countDocuments(),
      Attempt.countDocuments({ quizSubmittedAt: { $ne: null }, passed: false }),
    ]);
    return res.json({ role, stats: { employees, documents, pendingReviews, certificates, failedAssessments } });
  }

  if (role === "deptadmin") {
    const deptFilter = { department: department?._id };
    const [documents, published] = await Promise.all([
      Document.countDocuments(deptFilter),
      Document.countDocuments({ ...deptFilter, status: "published" }),
    ]);
    const deptDocs = await Document.find(deptFilter).select("_id");
    const deptDocIds = deptDocs.map((d) => d._id);
    const pendingVersions = await DocumentVersion.countDocuments({ document: { $in: deptDocIds }, status: "pending_approval" });
    return res.json({ role, stats: { documents, published, pendingReviews: pendingVersions } });
  }

  if (role === "approver") {
    const deptDocs = await Document.find({ department: department?._id }).select("_id");
    const deptDocIds = deptDocs.map((d) => d._id);
    const pendingReviews = await DocumentVersion.countDocuments({ document: { $in: deptDocIds }, status: "pending_approval" });
    const approvedCount = await DocumentVersion.countDocuments({ document: { $in: deptDocIds }, approvedBy: req.user._id });
    return res.json({ role, stats: { pendingReviews, approvedCount } });
  }

  if (role === "employee") {
    const [assigned, completed, certificates] = await Promise.all([
      Assignment.countDocuments({ employee: req.user._id }),
      Assignment.countDocuments({ employee: req.user._id, status: "completed" }),
      Certificate.countDocuments({ employee: req.user._id }),
    ]);
    return res.json({ role, stats: { assigned, completed, pending: assigned - completed, certificates } });
  }

  if (role === "auditor") {
    const [employees, certificates, failedAssessments, totalAttempts] = await Promise.all([
      User.countDocuments({ role: "employee" }),
      Certificate.countDocuments(),
      Attempt.countDocuments({ quizSubmittedAt: { $ne: null }, passed: false }),
      Attempt.countDocuments({ quizSubmittedAt: { $ne: null } }),
    ]);
    return res.json({ role, stats: { employees, certificates, failedAssessments, totalAttempts } });
  }

  res.json({ role, stats: {} });
});

module.exports = router;

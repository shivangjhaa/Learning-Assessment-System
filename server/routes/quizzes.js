const express = require("express");
const Quiz = require("../models/Quiz");
const DocumentVersion = require("../models/DocumentVersion");
const { protect, allowRoles } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.get("/version/:versionId", protect, async (req, res) => {
  const quiz = await Quiz.findOne({ documentVersion: req.params.versionId });
  if (!quiz) return res.status(404).json({ message: "No quiz found for this document." });

  if (["employee"].includes(req.user.role)) {
    const safe = {
      _id: quiz._id,
      passPercentage: quiz.passPercentage,
      questions: quiz.questions.map((q) => ({ _id: q._id, questionText: q.questionText, options: q.options })),
    };
    return res.json({ quiz: safe });
  }
  res.json({ quiz });
});

router.put("/version/:versionId", protect, allowRoles("deptadmin", "superadmin"), async (req, res) => {
  try {
    const { passPercentage, questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required." });
    }
    const version = await DocumentVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ message: "Document version not found." });

    const quiz = await Quiz.findOneAndUpdate(
      { documentVersion: req.params.versionId },
      { documentVersion: req.params.versionId, passPercentage: passPercentage || 80, questions },
      { new: true, upsert: true }
    );

    await logAction({
      userId: req.user._id,
      action: "QUIZ_SAVED",
      entityType: "Quiz",
      entityId: quiz._id,
      details: `Saved quiz with ${questions.length} question(s) for document version ${version._id}`,
    });

    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: "Failed to save quiz.", error: err.message });
  }
});

module.exports = router;

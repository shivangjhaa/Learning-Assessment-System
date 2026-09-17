const express = require("express");
const crypto = require("crypto");
const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const Assignment = require("../models/Assignment");
const Certificate = require("../models/Certificate");
const { protect, allowRoles } = require("../middleware/auth");
const { logAction } = require("../utils/audit");

const router = express.Router();

function generateCertificateCode() {
  return "CERT-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

router.get("/my", protect, allowRoles("employee"), async (req, res) => {
  const assignments = await Assignment.find({ employee: req.user._id })
    .populate({ path: "document", populate: [{ path: "department", select: "name code" }, { path: "currentVersion" }] })
    .sort({ createdAt: -1 });
  res.json({ assignments });
});

router.post("/read/start", protect, allowRoles("employee"), async (req, res) => {
  try {
    const { documentId } = req.body;
    const doc = await Document.findById(documentId).populate("currentVersion");
    if (!doc || !doc.currentVersion) return res.status(404).json({ message: "Document not found." });

    let attempt = await Attempt.findOne({
      employee: req.user._id,
      documentVersion: doc.currentVersion._id,
      quizSubmittedAt: null,
    }).sort({ createdAt: -1 });

    if (!attempt) {
      const priorCount = await Attempt.countDocuments({ employee: req.user._id, documentVersion: doc.currentVersion._id });
      attempt = await Attempt.create({
        employee: req.user._id,
        document: doc._id,
        documentVersion: doc.currentVersion._id,
        readStartedAt: new Date(),
        attemptNumber: priorCount + 1,
      });
      await logAction({
        userId: req.user._id,
        action: "READING_STARTED",
        entityType: "Attempt",
        entityId: attempt._id,
        details: `Started reading "${doc.title}"`,
      });
    }

    res.json({ attempt, minReadingTimeMinutes: doc.currentVersion.minReadingTimeMinutes });
  } catch (err) {
    res.status(500).json({ message: "Failed to start reading session.", error: err.message });
  }
});

router.post("/read/complete", protect, allowRoles("employee"), async (req, res) => {
  try {
    const { attemptId } = req.body;
    const attempt = await Attempt.findOne({ _id: attemptId, employee: req.user._id }).populate("documentVersion");
    if (!attempt) return res.status(404).json({ message: "Reading session not found." });

    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.readStartedAt).getTime()) / 1000);
    const requiredSeconds = (attempt.documentVersion.minReadingTimeMinutes || 0) * 60;

    if (elapsedSeconds < requiredSeconds) {
      return res.status(400).json({
        message: "Not completed. Minimum reading time isn't finished.",
        elapsedSeconds,
        requiredSeconds,
      });
    }

    attempt.readCompletedAt = new Date();
    attempt.readDurationSeconds = elapsedSeconds;
    attempt.readingRequirementMet = true;
    await attempt.save();

    await logAction({
      userId: req.user._id,
      action: "READING_COMPLETED",
      entityType: "Attempt",
      entityId: attempt._id,
      details: `Finished reading in ${elapsedSeconds}s`,
    });

    res.json({ attempt });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete reading session.", error: err.message });
  }
});

router.post("/quiz/submit", protect, allowRoles("employee"), async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const attempt = await Attempt.findOne({ _id: attemptId, employee: req.user._id }).populate("documentVersion");
    if (!attempt) return res.status(404).json({ message: "Attempt not found." });
    if (!attempt.readingRequirementMet) {
      return res.status(400).json({ message: "You must finish reading before taking the assessment." });
    }
    if (attempt.quizSubmittedAt) return res.status(400).json({ message: "This attempt has already been submitted." });

    const quiz = await Quiz.findOne({ documentVersion: attempt.documentVersion._id });
    if (!quiz || quiz.questions.length === 0) return res.status(404).json({ message: "No quiz configured for this document." });

    let correct = 0;
    const answerMap = new Map((answers || []).map((a) => [String(a.questionId), a.selectedIndex]));
    const breakdown = quiz.questions.map((q) => {
      const selectedIndex = answerMap.get(String(q._id));
      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) correct += 1;
      return {
        questionText: q.questionText,
        options: q.options,
        selectedIndex: selectedIndex ?? null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
      };
    });
    const totalQuestions = quiz.questions.length;
    const score = Math.round((correct / totalQuestions) * 100);
    const passed = score >= quiz.passPercentage;

    attempt.answers = (answers || []).map((a) => ({ questionId: a.questionId, selectedIndex: a.selectedIndex }));
    attempt.score = score;
    attempt.passed = passed;
    attempt.quizSubmittedAt = new Date();
    await attempt.save();

    await logAction({
      userId: req.user._id,
      action: "ASSESSMENT_SUBMITTED",
      entityType: "Attempt",
      entityId: attempt._id,
      details: `Scored ${score}% (${passed ? "passed" : "failed"})`,
    });

    let certificate = null;
    if (passed) {
      certificate = await Certificate.create({
        employee: req.user._id,
        document: attempt.document,
        documentVersion: attempt.documentVersion._id,
        attempt: attempt._id,
        score,
        certificateCode: generateCertificateCode(),
      });

      await Assignment.findOneAndUpdate(
        { employee: req.user._id, document: attempt.document },
        { status: "completed", completedAt: new Date() }
      );

      await logAction({
        userId: req.user._id,
        action: "CERTIFICATE_GENERATED",
        entityType: "Certificate",
        entityId: certificate._id,
        details: `Certificate ${certificate.certificateCode} issued with score ${score}%`,
      });
    }

    res.json({
      score,
      passed,
      passPercentage: quiz.passPercentage,
      correctCount: correct,
      incorrectCount: totalQuestions - correct,
      totalQuestions,
      breakdown,
      certificate,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit assessment.", error: err.message });
  }
});

module.exports = router;

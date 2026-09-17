const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    documentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentVersion", required: true },
    readStartedAt: { type: Date, default: null },
    readCompletedAt: { type: Date, default: null },
    readDurationSeconds: { type: Number, default: 0 },
    readingRequirementMet: { type: Boolean, default: false },
    quizSubmittedAt: { type: Date, default: null },
    answers: [{ questionId: mongoose.Schema.Types.ObjectId, selectedIndex: Number }],
    score: { type: Number, default: null },
    passed: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);

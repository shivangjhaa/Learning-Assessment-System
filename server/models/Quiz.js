const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: { type: [String], required: true, validate: (v) => v.length >= 2 },
    correctOptionIndex: { type: Number, required: true },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    documentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentVersion", required: true, unique: true },
    passPercentage: { type: Number, default: 80 },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);

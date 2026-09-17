const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

assignmentSchema.index({ employee: 1, document: 1 }, { unique: true });

module.exports = mongoose.model("Assignment", assignmentSchema);

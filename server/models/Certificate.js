const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    documentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentVersion", required: true },
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true },
    score: { type: Number, required: true },
    certificateCode: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);

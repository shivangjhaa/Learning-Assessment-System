const mongoose = require("mongoose");

const CATEGORIES = ["SOP", "Policy", "Work Instruction", "Forms", "Templates", "Videos"];

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    description: { type: String, default: "" },
    currentVersion: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentVersion", default: null },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected", "published"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
module.exports.CATEGORIES = CATEGORIES;

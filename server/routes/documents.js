const express = require("express");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const Document = require("../models/Document");
const DocumentVersion = require("../models/DocumentVersion");
const Quiz = require("../models/Quiz");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { logAction } = require("../utils/audit");

const router = express.Router();

// Number(x) || 5 silently turns a real 0 into 5 — only fall back to the default when the value
// is genuinely missing/blank, never when it's a valid 0.
function parseMinutes(raw, fallback = 5) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// Does this employee have access to a published document? Either it's in their own department,
// or they've been explicitly assigned to it (which can now cross department lines).
async function employeeCanAccess(doc, userId, userDepartmentId) {
  if (doc.status !== "published") return false;
  const sameDept = String(doc.department._id || doc.department) === String(userDepartmentId);
  if (sameDept) return true;
  const assignment = await Assignment.exists({ employee: userId, document: doc._id });
  return !!assignment;
}

// GET /api/documents - list, respecting the Authorization Matrix
router.get("/", protect, async (req, res) => {
  const { role, department, _id: userId } = req.user;
  let filter = {};

  if (role === "superadmin" || role === "auditor") {
    // full visibility
  } else if (role === "deptadmin" || role === "approver") {
    filter.department = department?._id;
  } else if (role === "employee") {
    // own department's published docs, PLUS anything specifically assigned across departments
    const assignedDocIds = (await Assignment.find({ employee: userId }).select("document")).map((a) => a.document);
    filter = {
      status: "published",
      $or: [{ department: department?._id }, { _id: { $in: assignedDocIds } }],
    };
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.department && (role === "superadmin" || role === "auditor")) filter.department = req.query.department;

  const documents = await Document.find(filter)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .populate("currentVersion")
    .sort({ updatedAt: -1 });

  res.json({ documents });
});

// GET /api/documents/:id - single document detail
router.get("/:id", protect, async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate("department", "name code")
    .populate("createdBy", "name email")
    .populate("currentVersion");
  if (!doc) return res.status(404).json({ message: "Document not found." });

  if (req.user.role === "employee") {
    const allowed = await employeeCanAccess(doc, req.user._id, req.user.department?._id);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this document." });
  }

  const versions = await DocumentVersion.find({ document: doc._id }).sort({ createdAt: -1 });
  const pendingVersion = versions.find((v) => v.status === "pending_approval") || null;
  res.json({ document: doc, versions, pendingVersion });
});

// PATCH /api/documents/:id - edit document metadata (title/category/description)
router.patch("/:id", protect, allowRoles("deptadmin", "superadmin"), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found." });

    if (req.user.role === "deptadmin" && String(doc.department) !== String(req.user.department?._id)) {
      return res.status(403).json({ message: "You can only edit documents in your own department." });
    }

    const { title, category, description } = req.body;
    if (title !== undefined) doc.title = title;
    if (category !== undefined) doc.category = category;
    if (description !== undefined) doc.description = description;
    await doc.save();

    await logAction({
      userId: req.user._id,
      action: "DOCUMENT_UPDATED",
      entityType: "Document",
      entityId: doc._id,
      details: `Updated details for "${doc.title}"`,
    });

    const populated = await Document.findById(doc._id).populate("department", "name code").populate("currentVersion");
    res.json({ document: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to update document.", error: err.message });
  }
});

// PATCH /api/documents/versions/:versionId - edit a version's minimum reading time / version number / notes
router.patch("/versions/:versionId", protect, allowRoles("deptadmin", "superadmin"), async (req, res) => {
  try {
    const version = await DocumentVersion.findById(req.params.versionId).populate("document");
    if (!version) return res.status(404).json({ message: "Document version not found." });

    if (req.user.role === "deptadmin" && String(version.document.department) !== String(req.user.department?._id)) {
      return res.status(403).json({ message: "You can only edit versions in your own department." });
    }

    const { versionNumber, minReadingTimeMinutes, versionNotes } = req.body;
    if (versionNumber !== undefined) version.versionNumber = versionNumber;
    if (minReadingTimeMinutes !== undefined) version.minReadingTimeMinutes = Number(minReadingTimeMinutes);
    if (versionNotes !== undefined) version.versionNotes = versionNotes;
    await version.save();

    await logAction({
      userId: req.user._id,
      action: "DOCUMENT_VERSION_UPDATED",
      entityType: "DocumentVersion",
      entityId: version._id,
      details: `Updated version ${version.versionNumber} settings for "${version.document.title}"`,
    });

    res.json({ version });
  } catch (err) {
    res.status(500).json({ message: "Failed to update version.", error: err.message });
  }
});

// GET /api/documents/:id/versions/:versionId/docx-html - render a .docx file to HTML for inline viewing
router.get("/:id/versions/:versionId/docx-html", protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate("department", "name code");
    if (!doc) return res.status(404).json({ message: "Document not found." });

    if (req.user.role === "employee") {
      const allowed = await employeeCanAccess(doc, req.user._id, req.user.department?._id);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this document." });
    }

    const version = await DocumentVersion.findById(req.params.versionId);
    if (!version || String(version.document) !== String(doc._id)) {
      return res.status(404).json({ message: "Document version not found." });
    }

    const isDocx =
      (version.fileType || "").includes("wordprocessingml") || (version.fileName || "").toLowerCase().endsWith(".docx");
    if (!isDocx) return res.status(400).json({ message: "This file isn't a .docx document." });

    const absolutePath = path.join(__dirname, "..", "uploads", path.basename(version.filePath));
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ message: "File not found on disk." });

    const result = await mammoth.convertToHtml({ path: absolutePath });
    res.json({ html: result.value, warningCount: (result.messages || []).length });
  } catch (err) {
    res.status(500).json({ message: "Failed to render this document. Try 'View file' to download it instead.", error: err.message });
  }
});

// POST /api/documents - create new document with its first version (deptadmin/superadmin)
router.post("/", protect, allowRoles("deptadmin", "superadmin"), upload.single("file"), async (req, res) => {
  try {
    const { title, category, description, versionNumber, minReadingTimeMinutes } = req.body;
    let { department } = req.body;

    // A Department Admin can only ever publish into their own department — never trust the
    // dropdown value alone, since the client could send any department id.
    if (req.user.role === "deptadmin") {
      department = req.user.department?._id;
    }

    if (!title || !department || !category || !req.file) {
      return res.status(400).json({ message: "Title, department, category and file are required." });
    }

    const doc = await Document.create({
      title,
      department,
      category,
      description: description || "",
      createdBy: req.user._id,
      status: "pending_approval",
    });

    const version = await DocumentVersion.create({
      document: doc._id,
      versionNumber: versionNumber || "1.0",
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      minReadingTimeMinutes: parseMinutes(minReadingTimeMinutes),
      uploadedBy: req.user._id,
      status: "pending_approval",
    });

    // IMPORTANT: do NOT set doc.currentVersion here. currentVersion must only ever point at an
    // APPROVED version — that's what makes "currently published version" mean something.

    await logAction({
      userId: req.user._id,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: doc._id,
      details: `Uploaded "${doc.title}" v${version.versionNumber} for approval`,
    });

    const populated = await Document.findById(doc._id).populate("department", "name code").populate("currentVersion");
    res.status(201).json({ document: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to create document.", error: err.message });
  }
});

// POST /api/documents/:id/versions - upload a new version to an existing document
router.post("/:id/versions", protect, allowRoles("deptadmin", "superadmin"), upload.single("file"), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found." });
    if (req.user.role === "deptadmin" && String(doc.department) !== String(req.user.department?._id)) {
      return res.status(403).json({ message: "You can only upload versions for documents in your own department." });
    }
    if (!req.file) return res.status(400).json({ message: "A file is required." });

    const { versionNumber, minReadingTimeMinutes, versionNotes } = req.body;

    const version = await DocumentVersion.create({
      document: doc._id,
      versionNumber: versionNumber || "next",
      fileName: req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      versionNotes: versionNotes || "",
      minReadingTimeMinutes: parseMinutes(minReadingTimeMinutes),
      uploadedBy: req.user._id,
      status: "pending_approval",
    });

    doc.status = "pending_approval";
    await doc.save();

    await logAction({
      userId: req.user._id,
      action: "DOCUMENT_VERSION_UPLOADED",
      entityType: "DocumentVersion",
      entityId: version._id,
      details: `Uploaded new version ${version.versionNumber} for "${doc.title}"`,
    });

    res.status(201).json({ version });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload new version.", error: err.message });
  }
});

// PATCH /api/documents/versions/:versionId/review - approver approves/rejects a version
router.patch("/versions/:versionId/review", protect, allowRoles("approver", "superadmin"), async (req, res) => {
  try {
    const { decision, comment } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'approve' or 'reject'." });
    }

    const version = await DocumentVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ message: "Document version not found." });

    version.status = decision === "approve" ? "approved" : "rejected";
    version.approvedBy = req.user._id;
    version.approverComment = comment || "";
    version.reviewedAt = new Date();
    await version.save();

    const doc = await Document.findById(version.document);
    let reopenedCount = 0;
    if (decision === "approve") {
      const previousVersionId = doc.currentVersion ? String(doc.currentVersion) : null;
      version.status = "published";
      await version.save();
      doc.status = "published";
      doc.currentVersion = version._id;

      // A newer version replaced an older published one — content changed, so anyone who already
      // completed the old version needs to re-read and re-test before it counts again. Their
      // certificate/attempt history for the previous version stays exactly as it was.
      if (previousVersionId && previousVersionId !== String(version._id)) {
        const reopened = await Assignment.updateMany(
          { document: doc._id, status: "completed" },
          { $set: { status: "pending" } }
        );
        reopenedCount = reopened.modifiedCount || 0;
      }
    } else {
      doc.status = "rejected";
    }
    await doc.save();

    await logAction({
      userId: req.user._id,
      action: decision === "approve" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
      entityType: "DocumentVersion",
      entityId: version._id,
      details: `${decision === "approve" ? "Approved" : "Rejected"} "${doc.title}" v${version.versionNumber}${comment ? ": " + comment : ""}${
        reopenedCount > 0 ? ` — ${reopenedCount} employee(s) must re-complete it on the new version` : ""
      }`,
    });

    res.json({ document: doc, version, reopenedCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to review document.", error: err.message });
  }
});

// POST /api/documents/:id/assign - assign a published document to employees, across one or more
// departments (deptadmin/superadmin). Accepts { departmentIds: [...], employeeIds: [...] } — either
// or both. "departmentIds" assigns every employee currently in those departments.
router.post("/:id/assign", protect, allowRoles("deptadmin", "superadmin"), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found." });
    if (req.user.role === "deptadmin" && String(doc.department) !== String(req.user.department?._id)) {
      return res.status(403).json({ message: "You can only assign documents in your own department." });
    }

    let { departmentIds, employeeIds } = req.body;

    // Backward compatible with the old "assign to whole department" shortcut.
    if (employeeIds === "all") {
      departmentIds = Array.isArray(departmentIds) ? [...departmentIds, String(doc.department)] : [String(doc.department)];
      employeeIds = [];
    }

    const idSet = new Set();
    if (Array.isArray(employeeIds)) employeeIds.forEach((id) => idSet.add(String(id)));

    let departmentsTouched = 0;
    if (Array.isArray(departmentIds) && departmentIds.length > 0) {
      const uniqueDeptIds = [...new Set(departmentIds.map(String))];
      departmentsTouched = uniqueDeptIds.length;
      const employees = await User.find({ role: "employee", department: { $in: uniqueDeptIds } }).select("_id");
      employees.forEach((e) => idSet.add(String(e._id)));
    }

    if (idSet.size === 0) {
      return res.status(400).json({ message: "Select at least one department or employee to assign to." });
    }

    const ops = [...idSet].map((employee) => ({
      updateOne: {
        filter: { employee, document: doc._id },
        update: { $setOnInsert: { employee, document: doc._id, assignedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Assignment.bulkWrite(ops);

    await logAction({
      userId: req.user._id,
      action: "DOCUMENT_ASSIGNED",
      entityType: "Document",
      entityId: doc._id,
      details: `Assigned "${doc.title}" to ${idSet.size} employee(s)${departmentsTouched ? ` across ${departmentsTouched} department(s)` : ""}`,
    });

    res.json({ message: `Assigned to ${idSet.size} employee(s).` });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign document.", error: err.message });
  }
});

// GET /api/documents/pending/approvals - list versions pending approval (approver/superadmin)
router.get("/pending/approvals", protect, allowRoles("approver", "superadmin"), async (req, res) => {
  const filter = { status: "pending_approval" };
  const versions = await DocumentVersion.find(filter)
    .populate({ path: "document", populate: { path: "department", select: "name code" } })
    .populate("uploadedBy", "name email")
    .sort({ createdAt: -1 });

  const scoped =
    req.user.role === "approver"
      ? versions.filter((v) => String(v.document?.department?._id) === String(req.user.department?._id))
      : versions;

  res.json({ versions: scoped });
});

module.exports = router;

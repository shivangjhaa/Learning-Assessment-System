const AuditLog = require("../models/AuditLog");

async function logAction({ userId = null, action, entityType = "", entityId = null, details = "" }) {
  try {
    await AuditLog.create({ user: userId, action, entityType, entityId, details });
  } catch (err) {
    console.error("[audit] failed to log action:", action, err.message);
  }
}

module.exports = { logAction };

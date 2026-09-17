require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Department = require("../models/Department");
const User = require("../models/User");

async function seed() {
  await connectDB();

  const deptDefs = [
    { name: "Human Resources", code: "HR" },
    { name: "Information Technology", code: "IT" },
    { name: "Finance", code: "FIN" },
    { name: "Operations", code: "OPS" },
    { name: "Production", code: "PROD" },
    { name: "Quality", code: "QA" },
    { name: "Supply Chain Management", code: "SCM" },
  ];

  const departments = {};
  for (const d of deptDefs) {
    const dept = await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
    departments[d.code] = dept;
  }
  console.log(`[seed] ${deptDefs.length} departments ready`);

  const demoUsers = [
    { name: "Ava Superadmin", email: "superadmin@adm.com", password: "Password123!", role: "superadmin", department: null },
    { name: "Rhea HR Admin", email: "deptadmin@adm.com", password: "Password123!", role: "deptadmin", department: departments.HR._id },
    { name: "Kabir Approver", email: "approver@adm.com", password: "Password123!", role: "approver", department: departments.HR._id },
    { name: "Shivang Employee", email: "employee@adm.com", password: "Password123!", role: "employee", department: departments.HR._id },
    { name: "Nina Auditor", email: "auditor@adm.com", password: "Password123!", role: "auditor", department: null },
    { name: "Ivan IT Employee", email: "employee.it@adm.com", password: "Password123!", role: "employee", department: departments.IT._id },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`[seed] user already exists: ${u.email}`);
      continue;
    }
    await User.create(u);
    console.log(`[seed] created user: ${u.email} / Password123!`);
  }

  console.log("[seed] Done. Log in with any of the emails above and password Password123!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

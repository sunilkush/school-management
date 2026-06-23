/**
 * Fee Module Demo Data Seeder
 * Run: node scripts/seedFeeData.mjs
 *
 * Creates: fee heads → fee structures → student fee assignments → installments
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const URI = process.env.MONGOOSE_URI;
if (!URI) { console.error("❌  MONGOOSE_URI not found in .env"); process.exit(1); }

/* ─── helpers ─────────────────────────────────────────────────────── */
const oid  = (s) => new mongoose.Types.ObjectId(s);
const log  = (msg) => console.log(`  ${msg}`);
const ok   = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const sep  = ()    => console.log("\n" + "─".repeat(56));

/* ─── Fee catalogue ──────────────────────────────────────────────── */
const FEE_HEADS = [
  { name: "Tuition Fee",   type: "recurring",  amount: 12000, frequency: "yearly"    },
  { name: "Transport Fee", type: "recurring",  amount:  3600, frequency: "monthly"   },
  { name: "Library Fee",   type: "recurring",  amount:  1200, frequency: "yearly"    },
  { name: "Computer Fee",  type: "recurring",  amount:  2400, frequency: "quarterly" },
  { name: "Sports Fee",    type: "one-time",   amount:  1200, frequency: "yearly"    },
];

/* ─── Main ──────────────────────────────────────────────────────── */
async function main() {
  console.log("\n🚀  Fee Module Demo Data Seeder");
  console.log("─".repeat(56));

  await mongoose.connect(URI);
  ok("Connected to MongoDB");

  const db = mongoose.connection.db;

  /* ── collections ── */
  const users        = db.collection("users");
  const schools      = db.collection("schools");
  const roles        = db.collection("roles");
  const acYears      = db.collection("academicyears");
  const schoolClasses= db.collection("schoolclasses");
  const enrollments  = db.collection("studentenrollments");
  const feeHeads     = db.collection("feeheads");
  const feeStructs   = db.collection("feestructures");
  const studentFees  = db.collection("studentfees");
  const installments = db.collection("feeinstallments");

  /* ══════════════════════════════════════════════════════════════
     STEP 1 – find School Admin user + school
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 1 — Find School Admin");

  const adminRole = await roles.findOne({ name: "School Admin" });
  if (!adminRole) { console.error("❌  No 'School Admin' role found"); process.exit(1); }

  const adminUser = await users.findOne(
    { roleId: adminRole._id },
    { projection: { name: 1, email: 1, schoolId: 1, school: 1 } }
  );
  if (!adminUser) { console.error("❌  No School Admin user found"); process.exit(1); }

  const schoolId =
    adminUser.schoolId ||
    adminUser.school?._id ||
    adminUser.school;

  if (!schoolId) { console.error("❌  School Admin has no schoolId"); process.exit(1); }

  const school = await schools.findOne({ _id: oid(schoolId.toString()) });
  ok(`School Admin : ${adminUser.name} (${adminUser.email})`);
  ok(`School       : ${school?.name || schoolId}`);

  /* ══════════════════════════════════════════════════════════════
     STEP 2 – find active academic year
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 2 — Active Academic Year");

  let acYear = await acYears.findOne({ schoolId: oid(schoolId.toString()), isActive: true });
  if (!acYear) acYear = await acYears.findOne({ schoolId: oid(schoolId.toString()) });
  if (!acYear) { console.error("❌  No academic year found for this school"); process.exit(1); }
  ok(`Academic Year: ${acYear.name} (${acYear.isActive ? "Active" : "Not active"})`);

  /* ══════════════════════════════════════════════════════════════
     STEP 3 – find school classes
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 3 — School Classes");

  const classes = await schoolClasses.find({ schoolId: oid(schoolId.toString()) }).toArray();
  if (!classes.length) { console.error("❌  No classes found for this school"); process.exit(1); }
  ok(`Found ${classes.length} class(es): ${classes.map(c => c.name || c._id).join(", ")}`);

  /* ══════════════════════════════════════════════════════════════
     STEP 4 – create fee heads
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 4 — Fee Heads");

  const feeHeadMap = {}; // name → _id

  for (const fh of FEE_HEADS) {
    const existing = await feeHeads.findOne({ schoolId: oid(schoolId.toString()), name: fh.name });
    if (existing) {
      warn(`Fee head already exists: "${fh.name}"`);
      feeHeadMap[fh.name] = existing._id;
      continue;
    }
    const result = await feeHeads.insertOne({
      schoolId: oid(schoolId.toString()),
      name:        fh.name,
      type:        fh.type,
      isEditable:  true,
      status:      "active",
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    feeHeadMap[fh.name] = result.insertedId;
    ok(`Created fee head: "${fh.name}"`);
  }

  /* ══════════════════════════════════════════════════════════════
     STEP 5 – create fee structures (per class × per fee head)
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 5 — Fee Structures");

  const structureMap = {}; // `${classId}-${feeHeadId}` → structureId
  let structCreated = 0, structSkipped = 0;

  for (const cls of classes) {
    for (const fh of FEE_HEADS) {
      const fhId = feeHeadMap[fh.name];
      const key  = `${cls._id}-${fhId}`;

      const existing = await feeStructs.findOne({
        schoolId:     oid(schoolId.toString()),
        schoolClassId: oid(cls._id.toString()),
        academicYearId: oid(acYear._id.toString()),
        feeHeadId:    oid(fhId.toString()),
      });

      if (existing) {
        structureMap[key] = existing._id;
        structSkipped++;
        continue;
      }

      const result = await feeStructs.insertOne({
        schoolId:      oid(schoolId.toString()),
        schoolClassId: oid(cls._id.toString()),
        academicYearId: oid(acYear._id.toString()),
        feeHeadId:     oid(fhId.toString()),
        amount:        fh.amount,
        frequency:     fh.frequency,
        isActive:      true,
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });
      structureMap[key] = result.insertedId;
      structCreated++;
    }
  }

  ok(`Created: ${structCreated}  |  Already existed: ${structSkipped}`);

  /* ══════════════════════════════════════════════════════════════
     STEP 6 – fetch enrolled students
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 6 — Student Enrollments");

  const enrolled = await enrollments.find({
    schoolId:      oid(schoolId.toString()),
    academicYearId: oid(acYear._id.toString()),
  }).toArray();

  if (!enrolled.length) {
    warn("No enrolled students found for this academic year.");
    warn("Create students & enroll them first, then re-run this script.");
  } else {
    ok(`Found ${enrolled.length} enrolled student(s)`);
  }

  /* ══════════════════════════════════════════════════════════════
     STEP 7 – assign fees to every enrolled student
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 7 — Assign Fees to Students");

  let feeAssigned = 0, feeSkipped = 0;
  const studentFeeIds = []; // track all created student fee _ids for installment generation

  for (const enr of enrolled) {
    const sId    = enr.studentId;
    const clsId  = enr.schoolClassId;

    for (const fh of FEE_HEADS) {
      const fhId      = feeHeadMap[fh.name];
      const structId  = structureMap[`${clsId}-${fhId}`];
      if (!structId) continue;

      const existing = await studentFees.findOne({
        schoolId:      oid(schoolId.toString()),
        academicYearId: oid(acYear._id.toString()),
        studentId:     oid(sId.toString()),
        feeStructureId: oid(structId.toString()),
      });

      if (existing) {
        studentFeeIds.push({ _id: existing._id, studentId: sId, totalAmount: existing.totalAmount, feeStructureId: existing.feeStructureId });
        feeSkipped++;
        continue;
      }

      const result = await studentFees.insertOne({
        schoolId:      oid(schoolId.toString()),
        academicYearId: oid(acYear._id.toString()),
        studentId:     oid(sId.toString()),
        feeStructureId: oid(structId.toString()),
        customAmount:  null,
        totalAmount:   fh.amount,
        paidAmount:    0,
        dueAmount:     fh.amount,
        status:        "pending",
        assignedBy:    adminUser._id,
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });

      studentFeeIds.push({ _id: result.insertedId, studentId: sId, totalAmount: fh.amount, feeStructureId: structId });
      feeAssigned++;
    }
  }

  ok(`Assigned: ${feeAssigned}  |  Already existed: ${feeSkipped}`);

  /* ══════════════════════════════════════════════════════════════
     STEP 8 – generate installments for each student fee
  ══════════════════════════════════════════════════════════════ */
  sep(); console.log("📋  STEP 8 — Generate Installments");

  let instCreated = 0, instSkipped = 0;

  for (const sf of studentFeeIds) {
    /* check if installments already exist for this student fee */
    const existCount = await installments.countDocuments({
      studentFeeId: oid(sf._id.toString()),
    });
    if (existCount > 0) { instSkipped++; continue; }

    /* find the fee structure to know frequency */
    const struct = await feeStructs.findOne({ _id: oid(sf.feeStructureId.toString()) });
    const frequency = struct?.frequency || "yearly";

    const count =
      frequency === "monthly"   ? 12 :
      frequency === "quarterly" ? 4  :
      1;
    const gapMonths =
      frequency === "monthly"   ? 1  :
      frequency === "quarterly" ? 3  :
      12;

    const instAmount = parseFloat((sf.totalAmount / count).toFixed(2));
    const baseDate   = new Date();
    const docs       = [];

    for (let i = 1; i <= count; i++) {
      const label =
        frequency === "monthly"   ? baseDate.toLocaleString("default", { month: "short", year: "2-digit" }) :
        frequency === "quarterly" ? `Q${i}` :
        "Annual";

      docs.push({
        schoolId:      oid(schoolId.toString()),
        academicYearId: oid(acYear._id.toString()),
        studentId:     oid(sf.studentId.toString()),
        studentFeeId:  oid(sf._id.toString()),
        installmentType: frequency,
        installmentName: label,
        amount:        instAmount,
        paidAmount:    0,
        dueDate:       new Date(baseDate),
        status:        "pending",
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });

      baseDate.setMonth(baseDate.getMonth() + gapMonths);
    }

    if (docs.length) {
      await installments.insertMany(docs);
      instCreated += docs.length;
    }
  }

  ok(`Installments created: ${instCreated}  |  Already existed (skipped): ${instSkipped}`);

  /* ══════════════════════════════════════════════════════════════
     SUMMARY
  ══════════════════════════════════════════════════════════════ */
  sep();
  console.log("✅  SEED COMPLETE — Summary\n");
  console.log(`   School        : ${school?.name}`);
  console.log(`   Academic Year : ${acYear.name}`);
  console.log(`   Classes       : ${classes.length}`);
  console.log(`   Fee Heads     : ${Object.keys(feeHeadMap).length}`);
  console.log(`   Fee Structures: ${structCreated + structSkipped}`);
  console.log(`   Student Fees  : ${feeAssigned + feeSkipped} total (${feeAssigned} new)`);
  console.log(`   Installments  : ${instCreated + instSkipped} total (${instCreated} new)`);
  console.log("\n   Now open the app and test:");
  console.log("   🔵 School Admin → Fee Collection → select student → Collect");
  console.log("   🟡 Student      → My Fees → Pay (Cash / Cheque / Online)");
  console.log("   🟢 Parent       → Fees → Pay Now (Cash / Cheque / Razorpay)");
  sep();

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Seeder failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});

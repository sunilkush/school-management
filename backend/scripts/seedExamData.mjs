/**
 * Exam Module Demo Data Seeder
 * Run: node scripts/seedExamData.mjs   (from backend/ directory)
 *
 * Creates:
 *  - 10 MCQ questions per class-subject
 *  - 1 LIVE exam (window: now-1h → now+3h) — students can start right now
 *  - 1 PAST exam (completed + results published) with evaluated attempts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const URI = process.env.MONGOOSE_URI;
if (!URI) { console.error("❌  MONGOOSE_URI not found in .env"); process.exit(1); }

const oid  = (s) => new mongoose.Types.ObjectId(s);
const now  = () => new Date();
const ok   = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const sep  = ()  => console.log("\n" + "─".repeat(60));

/* ── 10 demo MCQ questions (science themed) ─────────────────────── */
const QUESTION_TEMPLATES = [
  {
    statement: "Which planet is known as the Red Planet?",
    options: [
      { key: "A", text: "Venus" },
      { key: "B", text: "Mars" },
      { key: "C", text: "Jupiter" },
      { key: "D", text: "Saturn" },
    ],
    correctAnswers: ["B"],
    marks: 2,
  },
  {
    statement: "What is the chemical symbol for water?",
    options: [
      { key: "A", text: "HO" },
      { key: "B", text: "H2O2" },
      { key: "C", text: "H2O" },
      { key: "D", text: "OH2" },
    ],
    correctAnswers: ["C"],
    marks: 2,
  },
  {
    statement: "How many bones are in the adult human body?",
    options: [
      { key: "A", text: "196" },
      { key: "B", text: "206" },
      { key: "C", text: "216" },
      { key: "D", text: "226" },
    ],
    correctAnswers: ["B"],
    marks: 2,
  },
  {
    statement: "What is the speed of light (approx.) in vacuum?",
    options: [
      { key: "A", text: "3 × 10⁸ m/s" },
      { key: "B", text: "3 × 10⁶ m/s" },
      { key: "C", text: "3 × 10¹⁰ m/s" },
      { key: "D", text: "3 × 10⁴ m/s" },
    ],
    correctAnswers: ["A"],
    marks: 2,
  },
  {
    statement: "Which gas is most abundant in Earth's atmosphere?",
    options: [
      { key: "A", text: "Oxygen" },
      { key: "B", text: "Carbon Dioxide" },
      { key: "C", text: "Argon" },
      { key: "D", text: "Nitrogen" },
    ],
    correctAnswers: ["D"],
    marks: 2,
  },
  {
    statement: "What is the powerhouse of the cell?",
    options: [
      { key: "A", text: "Nucleus" },
      { key: "B", text: "Mitochondria" },
      { key: "C", text: "Ribosome" },
      { key: "D", text: "Golgi apparatus" },
    ],
    correctAnswers: ["B"],
    marks: 2,
  },
  {
    statement: "Newton's second law of motion states F = ?",
    options: [
      { key: "A", text: "m / a" },
      { key: "B", text: "m + a" },
      { key: "C", text: "ma" },
      { key: "D", text: "m² × a" },
    ],
    correctAnswers: ["C"],
    marks: 2,
  },
  {
    statement: "Which element has atomic number 1?",
    options: [
      { key: "A", text: "Helium" },
      { key: "B", text: "Oxygen" },
      { key: "C", text: "Carbon" },
      { key: "D", text: "Hydrogen" },
    ],
    correctAnswers: ["D"],
    marks: 2,
  },
  {
    statement: "The Earth completes one revolution around the Sun in approximately:",
    options: [
      { key: "A", text: "24 hours" },
      { key: "B", text: "30 days" },
      { key: "C", text: "365 days" },
      { key: "D", text: "12 months" },
    ],
    correctAnswers: ["C"],
    marks: 2,
  },
  {
    statement: "Which vitamin is produced when skin is exposed to sunlight?",
    options: [
      { key: "A", text: "Vitamin A" },
      { key: "B", text: "Vitamin B12" },
      { key: "C", text: "Vitamin C" },
      { key: "D", text: "Vitamin D" },
    ],
    correctAnswers: ["D"],
    marks: 2,
  },
];

async function main() {
  console.log("\n🚀  Exam Module Demo Data Seeder");
  console.log("─".repeat(60));

  await mongoose.connect(URI);
  ok("Connected to MongoDB");

  const db = mongoose.connection.db;

  const users       = db.collection("users");
  const roles       = db.collection("roles");
  const schools     = db.collection("schools");
  const acYears     = db.collection("academicyears");
  const schoolClasses = db.collection("schoolclasses");
  const sections    = db.collection("sections");
  const subjects       = db.collection("subjects");
  const classSubjects  = db.collection("schoolclasssubjects");
  const students    = db.collection("students");
  const enrollments = db.collection("studentenrollments");
  const questions   = db.collection("questions");
  const exams       = db.collection("exams");
  const attempts    = db.collection("examattempts");

  /* ── STEP 1: resolve School Admin & school ──────────────────── */
  sep(); console.log("📋  STEP 1 — School Admin & School");

  const adminRole = await roles.findOne({ name: "School Admin" });
  if (!adminRole) { console.error("❌  No 'School Admin' role"); process.exit(1); }

  const adminUser = await users.findOne(
    { roleId: adminRole._id },
    { projection: { _id: 1, name: 1, email: 1, schoolId: 1 } }
  );
  if (!adminUser) { console.error("❌  No School Admin user found"); process.exit(1); }

  const schoolId = adminUser.schoolId;
  if (!schoolId) { console.error("❌  School Admin has no schoolId"); process.exit(1); }

  const school = await schools.findOne({ _id: oid(schoolId.toString()) });
  ok(`School Admin : ${adminUser.name} (${adminUser.email})`);
  ok(`School       : ${school?.name || schoolId}`);

  /* ── STEP 2: active academic year ───────────────────────────── */
  sep(); console.log("📋  STEP 2 — Academic Year");

  let acYear = await acYears.findOne({ schoolId: oid(schoolId.toString()), isActive: true });
  if (!acYear) acYear = await acYears.findOne({ schoolId: oid(schoolId.toString()) });
  if (!acYear) { console.error("❌  No academic year found"); process.exit(1); }
  ok(`Academic Year: ${acYear.name}`);

  /* ── STEP 3: pick a class ────────────────────────────────────── */
  sep(); console.log("📋  STEP 3 — Class & Subject");

  const allClasses = await schoolClasses.find({ schoolId: oid(schoolId.toString()) }).toArray();
  if (!allClasses.length) { console.error("❌  No classes found"); process.exit(1); }
  const schoolClass = allClasses[0];
  ok(`Class: ${schoolClass.name || schoolClass._id}`);

  // optional section
  const section = await sections.findOne({ schoolClassId: schoolClass._id, schoolId: oid(schoolId.toString()) });
  if (section) ok(`Section: ${section.name}`);

  // pick subject via SchoolClassSubject join table
  let subject = null;
  {
    const csLink = await classSubjects.findOne({
      schoolId: oid(schoolId.toString()),
      schoolClassId: schoolClass._id,
    });
    if (csLink) {
      subject = await subjects.findOne({ _id: csLink.subjectId });
    }
    // fallback: any subject for this school
    if (!subject) subject = await subjects.findOne({ schoolId: oid(schoolId.toString()) });
    // last-resort fallback: any subject
    if (!subject) subject = await subjects.findOne({});
  }
  if (!subject) { console.error("❌  No subject found at all"); process.exit(1); }
  ok(`Subject: ${subject.name || subject._id}`);

  /* ── STEP 4: find Teacher ────────────────────────────────────── */
  sep(); console.log("📋  STEP 4 — Teacher");

  const teacherRole = await roles.findOne({ name: "Teacher" });
  let teacherUser = null;
  if (teacherRole) {
    teacherUser = await users.findOne(
      { roleId: teacherRole._id, schoolId: oid(schoolId.toString()) },
      { projection: { _id: 1, name: 1, email: 1 } }
    );
  }
  const createdBy = teacherUser?._id || adminUser._id;
  ok(`Created by: ${teacherUser?.name || adminUser.name}`);

  /* ── STEP 5: find enrolled students ─────────────────────────── */
  sep(); console.log("📋  STEP 5 — Students");

  const studentRole = await roles.findOne({ name: "Student" });
  let studentUsers = [];
  if (studentRole) {
    studentUsers = await users
      .find(
        { roleId: studentRole._id, schoolId: oid(schoolId.toString()) },
        { projection: { _id: 1, name: 1, email: 1 } }
      )
      .limit(5)
      .toArray();
  }
  if (!studentUsers.length) {
    warn("No Student users found — skipping attempt seeding");
  } else {
    ok(`Found ${studentUsers.length} student(s)`);
  }

  /* ── STEP 6: upsert questions ────────────────────────────────── */
  sep(); console.log("📋  STEP 6 — Questions");

  const questionIds = [];
  for (const tpl of QUESTION_TEMPLATES) {
    const existing = await questions.findOne({
      schoolId: oid(schoolId.toString()),
      statement: tpl.statement,
    });
    if (existing) {
      warn(`Question already exists: "${tpl.statement.slice(0, 40)}..."`);
      questionIds.push(existing._id);
      continue;
    }
    const { insertedId } = await questions.insertOne({
      schoolId: oid(schoolId.toString()),
      schoolClassId: schoolClass._id,
      subjectId: subject._id,
      questionType: "mcq_single",
      statement: tpl.statement,
      options: tpl.options,
      correctAnswers: tpl.correctAnswers,
      marks: tpl.marks,
      negativeMarks: 0,
      createdBy,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    questionIds.push(insertedId);
    ok(`Created question: "${tpl.statement.slice(0, 45)}..."`);
  }

  /* ── helper: build questions array for exam ─────────────────── */
  const buildExamQuestions = (qIds) =>
    qIds.map((qId, i) => ({
      questionId: qId,
      snapshot: { ...QUESTION_TEMPLATES[i], _id: qId, questionType: "mcq_single" },
      marks: QUESTION_TEMPLATES[i].marks,
    }));

  const totalMarks = QUESTION_TEMPLATES.reduce((s, q) => s + q.marks, 0); // 20

  /* ── STEP 7: create LIVE exam (active right now) ─────────────── */
  sep(); console.log("📋  STEP 7 — Live Exam (students can start now)");

  const liveExamTitle = `[DEMO] Science Quiz — Live Exam`;
  let liveExam = await exams.findOne({ schoolId: oid(schoolId.toString()), title: liveExamTitle });

  if (liveExam) {
    warn("Live exam already exists — updating window to be active now");
    const liveStart = new Date(Date.now() - 60 * 60 * 1000);   // 1 hour ago
    const liveEnd   = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
    await exams.updateOne(
      { _id: liveExam._id },
      { $set: { startTime: liveStart, endTime: liveEnd, status: "published", updatedAt: new Date() } }
    );
    liveExam = await exams.findOne({ _id: liveExam._id });
    ok(`Live exam window updated: ${liveStart.toISOString()} → ${liveEnd.toISOString()}`);
  } else {
    const liveStart = new Date(Date.now() - 60 * 60 * 1000);
    const liveEnd   = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const { insertedId } = await exams.insertOne({
      academicYearId: acYear._id,
      schoolId: oid(schoolId.toString()),
      title: liveExamTitle,
      examCode: "DEMO-LIVE-01",
      schoolClassId: schoolClass._id,
      sectionId: section?._id || null,
      subjectId: subject._id,
      examType: "Unit Test",
      examDate: liveStart,
      startTime: liveStart,
      endTime: liveEnd,
      durationMinutes: 30,
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      questionOrder: "fixed",
      shuffleOptions: false,
      questions: buildExamQuestions(questionIds),
      settings: { negativeMarking: 0, allowPartialScoring: false, maxAttempts: 1 },
      createdBy,
      status: "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    liveExam = await exams.findOne({ _id: insertedId });
    ok(`Live exam created: "${liveExamTitle}" (${liveStart.toISOString()} → ${liveEnd.toISOString()})`);
  }

  /* ── STEP 8: create PAST exam with evaluated results ────────── */
  sep(); console.log("📋  STEP 8 — Past Exam (evaluated + results published)");

  const pastExamTitle = `[DEMO] Science Quiz — Past Exam (Results Ready)`;
  let pastExam = await exams.findOne({ schoolId: oid(schoolId.toString()), title: pastExamTitle });

  if (!pastExam) {
    const pastStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const pastEnd   = new Date(pastStart.getTime() + 60 * 60 * 1000);  // 1 hour duration
    const { insertedId } = await exams.insertOne({
      academicYearId: acYear._id,
      schoolId: oid(schoolId.toString()),
      title: pastExamTitle,
      examCode: "DEMO-PAST-01",
      schoolClassId: schoolClass._id,
      sectionId: section?._id || null,
      subjectId: subject._id,
      examType: "Unit Test",
      examDate: pastStart,
      startTime: pastStart,
      endTime: pastEnd,
      durationMinutes: 30,
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      questionOrder: "fixed",
      shuffleOptions: false,
      questions: buildExamQuestions(questionIds),
      settings: { negativeMarking: 0, allowPartialScoring: false, maxAttempts: 1 },
      createdBy,
      status: "completed",
      createdAt: pastStart,
      updatedAt: new Date(),
    });
    pastExam = await exams.findOne({ _id: insertedId });
    ok(`Past exam created: "${pastExamTitle}"`);
  } else {
    warn("Past exam already exists — skipping creation");
  }

  /* ── STEP 9: create evaluated attempts for past exam ────────── */
  sep(); console.log("📋  STEP 9 — Evaluated Attempts (past exam)");

  if (studentUsers.length && pastExam) {
    // student answers: first 7 correct (14 marks), last 3 wrong (0 marks) = 14/20
    const demoResponses = QUESTION_TEMPLATES.map((q, i) =>
      i < 7 ? q.correctAnswers[0] : "A" // A is wrong for most
    );

    for (const stu of studentUsers) {
      const existingAttempt = await attempts.findOne({ examId: pastExam._id, studentId: stu._id });
      if (existingAttempt) {
        warn(`Attempt already exists for student: ${stu.name || stu.email}`);
        continue;
      }

      const answerDocs = questionIds.map((qId, i) => {
        const tpl      = QUESTION_TEMPLATES[i];
        const response = demoResponses[i];
        const correct  = tpl.correctAnswers[0] === response;
        return {
          questionId: qId,
          snapshot: { ...tpl, _id: qId, questionType: "mcq_single" },
          response,
          isCorrect: correct,
          marksObtained: correct ? tpl.marks : 0,
          flagged: false,
          reviewComments: "",
        };
      });

      const totalObtained = answerDocs.reduce((s, a) => s + a.marksObtained, 0);
      const startedAt  = new Date(pastExam.startTime.getTime() + 5 * 60 * 1000);
      const submittedAt = new Date(startedAt.getTime() + 25 * 60 * 1000);

      await attempts.insertOne({
        examId: pastExam._id,
        studentId: stu._id,
        schoolId: oid(schoolId.toString()),
        attemptNumber: 1,
        startedAt,
        endedAt: submittedAt,
        submittedAt,
        answers: answerDocs,
        totalObtainedMarks: totalObtained,
        status: "evaluated",
        evaluatedBy: createdBy,
        createdAt: startedAt,
        updatedAt: submittedAt,
      });
      ok(`Attempt seeded for student: ${stu.name || stu.email} — ${totalObtained}/${totalMarks}`);
    }
  }

  /* ── STEP 10: summary ────────────────────────────────────────── */
  sep();
  console.log("\n🎉  Exam Seed Complete!\n");
  console.log("  📝  Questions created    :", questionIds.length);
  console.log("  🟢  Live exam (students can start NOW):");
  console.log(`         Title  : ${liveExam?.title}`);
  console.log(`         Status : ${liveExam?.status}`);
  console.log(`         Window : now-1h → now+3h`);
  console.log("  📊  Past exam (results already evaluated):");
  console.log(`         Title  : ${pastExam?.title}`);
  console.log(`         Status : ${pastExam?.status}`);
  console.log(`         Attempts seeded: ${studentUsers.length}`);
  console.log("\n  Test URLs (after login):");
  console.log("    Student  → /dashboard/student/exams");
  console.log("    Teacher  → /dashboard/teacher/exams");
  console.log("    ExamCoord→ /dashboard/exam-coordinator");
  console.log("    Parent   → /dashboard/parent/exams  (if parent linked to student)");
  console.log("");

  await mongoose.disconnect();
  ok("Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("❌  Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});

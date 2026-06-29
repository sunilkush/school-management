/**
 * Seed questions + assign Rajesh Kumar as subject teacher to sections
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

await mongoose.connect(`${process.env.MONGOOSE_URI}/school_management`);
console.log("✓ MongoDB connected");

const db = mongoose.connection.db;
const schoolsColl   = db.collection("schools");
const usersColl     = db.collection("users");
const classesColl   = db.collection("schoolclasses");
const subjectsColl  = db.collection("subjects");
const sectionsColl  = db.collection("sections");
const questionsColl = db.collection("questions");
const aysColl       = db.collection("academicyears");
const rolesColl     = db.collection("roles");

const school = await schoolsColl.findOne({ isActive: true });
const schoolId = school._id;
console.log("School:", school.name);

// Active AY for this school
const ay = await aysColl.findOne({ schoolId, isActive: true });
const ayId = ay._id;
console.log("AY:", ay.name, ayId);

// Teacher
const rajesh = await usersColl.findOne({ email: "rajesh.kumar@dps.demo" });
const rajeshId = rajesh._id;
console.log("Teacher:", rajesh.name);

// Admin
const adminRole = await rolesColl.findOne({ name: "School Admin" });
const admin = await usersColl.findOne({ schoolId, roleId: adminRole?._id });
const adminId = admin?._id || rajeshId;
console.log("Admin:", admin?.name);

// Subjects (schoolId: null means global)
const allSubjects = await subjectsColl.find({
  $or: [{ schoolId }, { schoolId: null }]
}).toArray();
console.log("Subjects:", allSubjects.map(s => s.name).join(", "));

const mathSub = allSubjects.find(s => /math/i.test(s.name));
const engSub  = allSubjects.find(s => /eng/i.test(s.name));
const sciSub  = allSubjects.find(s => /sci|physics|chem|bio/i.test(s.name));
const hindiSub = allSubjects.find(s => /hindi/i.test(s.name));

console.log("\nTarget subjects:");
if (mathSub) console.log("  Math:", mathSub.name, mathSub._id);
if (engSub)  console.log("  English:", engSub.name, engSub._id);
if (sciSub)  console.log("  Science:", sciSub.name, sciSub._id);

// Get valid school classes - deduplicate by name, keep oldest (first) per name
const allSchoolClasses = await classesColl.find({ schoolId }).sort({ createdAt: 1 }).toArray();
const seenNames = new Set();
const uniqueClasses = allSchoolClasses.filter(c => {
  if (seenNames.has(c.name)) return false;
  seenNames.add(c.name);
  return true;
});
console.log("Valid classes (unique):", uniqueClasses.map(c => `${c.name}(${c._id})`).slice(0, 5).join(", "));
const targetClassDocs = uniqueClasses.slice(0, 3); // use first 3 unique classes

// ── STEP 1: Create sections + assign Rajesh Kumar as subject teacher ─────────
console.log("\n── Assigning Rajesh Kumar as subject teacher ──");
let assignCount = 0;
const targetSubjects = [mathSub, engSub].filter(Boolean); // math & english for rajesh

const activeSections = []; // sections we'll use for question seeding

for (const cls of targetClassDocs) {
  // Find existing section for this class (unique index is classId+name, not including AY)
  let sec = await sectionsColl.findOne({ schoolClassId: cls._id, name: "A" });
  if (!sec) sec = await sectionsColl.findOne({ schoolClassId: cls._id });
  if (!sec) {
    const newSec = {
      _id: new mongoose.Types.ObjectId(),
      schoolId,
      schoolClassId: cls._id,
      academicYearId: ayId,
      name: "A",
      capacity: 40,
      subjects: [],
      classTeacherId: rajeshId,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };
    await sectionsColl.insertOne(newSec);
    sec = newSec;
    console.log(`  Created section A for ${cls.name}`);
  }
  activeSections.push({ sec, cls });

  const existingSubs = sec.subjects || [];
  for (const sub of targetSubjects) {
    const already = existingSubs.some(
      s => s.subjectId?.toString() === sub._id.toString()
        && s.teacherId?.toString() === rajeshId.toString()
    );
    if (!already) {
      const subExists = existingSubs.some(s => s.subjectId?.toString() === sub._id.toString());
      if (subExists) {
        await sectionsColl.updateOne(
          { _id: sec._id, "subjects.subjectId": sub._id },
          { $set: { "subjects.$.teacherId": rajeshId } }
        );
      } else {
        await sectionsColl.updateOne(
          { _id: sec._id },
          { $push: { subjects: { subjectId: sub._id, teacherId: rajeshId } } }
        );
      }
      assignCount++;
      console.log(`  ✓ ${rajesh.name} → ${sub.name} in ${cls.name}-${sec.name}`);
    } else {
      console.log(`  - Already: ${sub.name} in ${cls.name}-${sec.name}`);
    }
  }
}
console.log(`New assignments: ${assignCount}`);

// ── STEP 2: Seed diverse questions ──────────────────────────────────────────
const existing = await questionsColl.countDocuments({ schoolId });
console.log(`\nExisting questions for this school: ${existing}`);

// Use first 2 classes from active sections
const cls1 = activeSections[0]?.cls;
const cls2 = activeSections[1]?.cls || cls1;

if (!cls1) {
  console.log("No classes found, aborting question seed.");
  await mongoose.disconnect();
  process.exit(0);
}
console.log("Seeding questions for:", cls1.name, cls2?.name !== cls1.name ? `& ${cls2.name}` : "");

const makeQ = (base, cls, sub) => ({
  _id: new mongoose.Types.ObjectId(),
  schoolId,
  schoolClassId: cls._id,
  subjectId: sub._id,
  createdBy: adminId,
  isActive: true,
  negativeMarks: 0,
  status: "Active",
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0,
  ...base,
  tags: [...(base.tags || []), cls.name.toLowerCase().replace(/\s+/g, "-")],
});

const toInsert = [];

// ── MATHEMATICS (if mathSub exists) ─────────────────────────────────────────
if (mathSub) {
  const mathQs = [
    { statement: "If x² - 5x + 6 = 0, what are the values of x?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "x = 2, 3" }, { key: "B", text: "x = 1, 6" }, { key: "C", text: "x = -2, -3" }, { key: "D", text: "x = 2, -3" }],
      correctAnswers: ["A"], difficulty: "medium", marks: 2, tags: ["algebra"] },

    { statement: "The sum of angles in a triangle is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "90°" }, { key: "B", text: "180°" }, { key: "C", text: "270°" }, { key: "D", text: "360°" }],
      correctAnswers: ["B"], difficulty: "easy", marks: 1, tags: ["geometry"] },

    { statement: "Which of the following is NOT a prime number?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "2" }, { key: "B", text: "17" }, { key: "C", text: "51" }, { key: "D", text: "31" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["number-theory"] },

    { statement: "A rectangle has length 12 cm and breadth 8 cm. Its area is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "40 cm²" }, { key: "B", text: "80 cm²" }, { key: "C", text: "96 cm²" }, { key: "D", text: "192 cm²" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["mensuration"] },

    { statement: "What is the value of √144?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "10" }, { key: "B", text: "11" }, { key: "C", text: "12" }, { key: "D", text: "14" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["arithmetic"] },

    { statement: "Every square is also a rectangle.",
      questionType: "true_false", options: [],
      correctAnswers: ["true"], difficulty: "easy", marks: 1, tags: ["geometry"] },

    { statement: "The Pythagoras theorem applies to a _______ triangle.",
      questionType: "fill_blank", options: [],
      correctAnswers: ["right", "right-angled"], difficulty: "medium", marks: 1, tags: ["geometry"] },

    { statement: "Which of the following are factors of 36? (Select all that apply)",
      questionType: "mcq_multi",
      options: [{ key: "A", text: "4" }, { key: "B", text: "9" }, { key: "C", text: "7" }, { key: "D", text: "12" }],
      correctAnswers: ["A", "B", "D"], difficulty: "medium", marks: 2, tags: ["number-theory"] },

    { statement: "The value of π (pi) is approximately:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "3.12" }, { key: "B", text: "3.14" }, { key: "C", text: "3.16" }, { key: "D", text: "3.18" }],
      correctAnswers: ["B"], difficulty: "easy", marks: 1, tags: ["constants"] },

    { statement: "LCM of 4 and 6 is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "12" }, { key: "B", text: "24" }, { key: "C", text: "6" }, { key: "D", text: "2" }],
      correctAnswers: ["A"], difficulty: "easy", marks: 1, tags: ["arithmetic"] },

    { statement: "If 2x + 3 = 11, then x = _______.",
      questionType: "fill_blank", options: [],
      correctAnswers: ["4"], difficulty: "easy", marks: 1, tags: ["algebra"] },

    { statement: "The perimeter of a square with side 5 cm is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "10 cm" }, { key: "B", text: "15 cm" }, { key: "C", text: "20 cm" }, { key: "D", text: "25 cm" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["mensuration"] },
  ];
  mathQs.forEach(q => {
    toInsert.push(makeQ(q, cls1, mathSub));
    if (cls2 && cls2._id.toString() !== cls1._id.toString()) {
      toInsert.push(makeQ(q, cls2, mathSub));
    }
  });
}

// ── ENGLISH ──────────────────────────────────────────────────────────────────
if (engSub) {
  const engQs = [
    { statement: "Which of the following is a noun?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Run" }, { key: "B", text: "Happy" }, { key: "C", text: "Delhi" }, { key: "D", text: "Quickly" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["grammar"] },

    { statement: "The passive voice of 'She writes a letter' is:",
      questionType: "mcq_single",
      options: [
        { key: "A", text: "A letter is written by her." },
        { key: "B", text: "A letter was written by her." },
        { key: "C", text: "A letter has been written by her." },
        { key: "D", text: "A letter will be written by her." }],
      correctAnswers: ["A"], difficulty: "medium", marks: 2, tags: ["grammar"] },

    { statement: "The literary device in 'The thunder roared like a lion' is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Metaphor" }, { key: "B", text: "Simile" }, { key: "C", text: "Personification" }, { key: "D", text: "Alliteration" }],
      correctAnswers: ["B"], difficulty: "medium", marks: 2, tags: ["literature"] },

    { statement: "'Their', 'There', and 'They're' all have the same meaning.",
      questionType: "true_false", options: [],
      correctAnswers: ["false"], difficulty: "easy", marks: 1, tags: ["vocabulary"] },

    { statement: "The antonym of 'benevolent' is _______.",
      questionType: "fill_blank", options: [],
      correctAnswers: ["malevolent", "cruel"], difficulty: "hard", marks: 2, tags: ["vocabulary"] },

    { statement: "Which sentence is grammatically correct?",
      questionType: "mcq_single",
      options: [
        { key: "A", text: "She don't know the answer." },
        { key: "B", text: "They is going to school." },
        { key: "C", text: "He doesn't like mangoes." },
        { key: "D", text: "We was playing cricket." }],
      correctAnswers: ["C"], difficulty: "medium", marks: 1, tags: ["grammar"] },

    { statement: "Which of these are prepositions? (Select all that apply)",
      questionType: "mcq_multi",
      options: [{ key: "A", text: "in" }, { key: "B", text: "run" }, { key: "C", text: "under" }, { key: "D", text: "happy" }],
      correctAnswers: ["A", "C"], difficulty: "easy", marks: 2, tags: ["grammar"] },

    { statement: "The plural of 'child' is _______.",
      questionType: "fill_blank", options: [],
      correctAnswers: ["children"], difficulty: "easy", marks: 1, tags: ["vocabulary"] },

    { statement: "A 'biography' is a book written about:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Animals" }, { key: "B", text: "Fictional characters" }, { key: "C", text: "A real person's life" }, { key: "D", text: "Science topics" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["literature"] },

    { statement: "Which tense is used in: 'She has been studying for three hours'?",
      questionType: "mcq_single",
      options: [
        { key: "A", text: "Simple Present" },
        { key: "B", text: "Present Perfect" },
        { key: "C", text: "Present Perfect Continuous" },
        { key: "D", text: "Past Continuous" }],
      correctAnswers: ["C"], difficulty: "hard", marks: 2, tags: ["grammar"] },
  ];
  engQs.forEach(q => {
    toInsert.push(makeQ(q, cls1, engSub));
    if (cls2 && cls2._id.toString() !== cls1._id.toString()) {
      toInsert.push(makeQ(q, cls2, engSub));
    }
  });
}

// ── SCIENCE (if different from math/english) ─────────────────────────────────
if (sciSub && sciSub._id.toString() !== mathSub?._id.toString() && sciSub._id.toString() !== engSub?._id.toString()) {
  const sciQs = [
    { statement: "Which gas is released during photosynthesis?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "CO₂" }, { key: "B", text: "Nitrogen" }, { key: "C", text: "Oxygen" }, { key: "D", text: "Hydrogen" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["biology"] },

    { statement: "The chemical formula of water is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "H₂O₂" }, { key: "B", text: "H₂O" }, { key: "C", text: "HO₂" }, { key: "D", text: "H₃O" }],
      correctAnswers: ["B"], difficulty: "easy", marks: 1, tags: ["chemistry"] },

    { statement: "Sound can travel through vacuum.",
      questionType: "true_false", options: [],
      correctAnswers: ["false"], difficulty: "medium", marks: 1, tags: ["physics"] },

    { statement: "The process by which plants make food using sunlight is called _______.",
      questionType: "fill_blank", options: [],
      correctAnswers: ["photosynthesis"], difficulty: "easy", marks: 1, tags: ["biology"] },

    { statement: "Which of the following are renewable sources of energy?",
      questionType: "mcq_multi",
      options: [{ key: "A", text: "Solar" }, { key: "B", text: "Coal" }, { key: "C", text: "Wind" }, { key: "D", text: "Petroleum" }],
      correctAnswers: ["A", "C"], difficulty: "medium", marks: 2, tags: ["energy"] },

    { statement: "Newton's First Law is also called the Law of:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Gravitation" }, { key: "B", text: "Inertia" }, { key: "C", text: "Acceleration" }, { key: "D", text: "Reaction" }],
      correctAnswers: ["B"], difficulty: "easy", marks: 1, tags: ["physics"] },

    { statement: "Which cell organelle is the 'powerhouse of the cell'?",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Nucleus" }, { key: "B", text: "Ribosome" }, { key: "C", text: "Mitochondria" }, { key: "D", text: "Chloroplast" }],
      correctAnswers: ["C"], difficulty: "medium", marks: 2, tags: ["biology"] },

    { statement: "The SI unit of electric current is:",
      questionType: "mcq_single",
      options: [{ key: "A", text: "Volt" }, { key: "B", text: "Watt" }, { key: "C", text: "Ampere" }, { key: "D", text: "Ohm" }],
      correctAnswers: ["C"], difficulty: "easy", marks: 1, tags: ["physics"] },
  ];
  sciQs.forEach(q => {
    toInsert.push(makeQ(q, cls1, sciSub));
  });
}

if (toInsert.length) {
  const result = await questionsColl.insertMany(toInsert);
  console.log(`\n✓ Inserted ${result.insertedCount} questions`);
  const typeSummary = {};
  toInsert.forEach(q => { typeSummary[q.questionType] = (typeSummary[q.questionType] || 0) + 1; });
  console.log("By type:", typeSummary);
  console.log("Total in DB:", await questionsColl.countDocuments({ schoolId }));
} else {
  console.log("Nothing to insert.");
}

await mongoose.disconnect();
console.log("✓ Done");

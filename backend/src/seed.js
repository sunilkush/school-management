import dotenv from "dotenv";
import mongoose from "mongoose";

import { DB_NAME } from "./constants.js";
import { Role } from "./models/Roles.model.js";
import { School } from "./models/school.model.js";
import { AcademicYear } from "./models/AcademicYear.model.js";
import { Class } from "./models/classes.model.js";
import Board from "./models/Board.model.js";
import { BoardClass } from "./models/BoardClass.model.js";
import { SchoolClass } from "./models/schoolClass.model.js";
import { Section } from "./models/section.model.js";
import { Subject } from "./models/subject.model.js";
import { User } from "./models/user.model.js";
import { Student } from "./models/student.model.js";
import { StudentEnrollment } from "./models/StudentEnrollment.model.js";
import { Attendance } from "./models/attendance.model.js";
import { FeeHead } from "./models/feeHead.model.js";
import { FeeStructure } from "./models/feeStructure.model.js";
import { Exam } from "./models/Exam.model.js";
import { Inventory } from "./models/Inventory.model.js";
import { Book } from "./models/Books.model.js";
import { IssuedBook } from "./models/IssuedBooks.model.js";

dotenv.config();

const connectDb = async () => {
  if (!process.env.MONGOOSE_URI) {
    throw new Error("MONGOOSE_URI missing in environment.");
  }

  await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
  console.log("✅ MongoDB connected for seeding");
};

const clearSeedCollections = async () => {
  await Promise.all([
    IssuedBook.deleteMany({}),
    Book.deleteMany({}),
    Inventory.deleteMany({}),
    Exam.deleteMany({}),
    FeeStructure.deleteMany({}),
    FeeHead.deleteMany({}),
    Attendance.deleteMany({}),
    StudentEnrollment.deleteMany({}),
    Student.deleteMany({}),
    User.deleteMany({}),
    Section.deleteMany({}),
    SchoolClass.deleteMany({}),
    BoardClass.deleteMany({}),
    Board.deleteMany({}),
    Class.deleteMany({}),
    AcademicYear.deleteMany({}),
    School.deleteMany({}),
    Role.deleteMany({}),
  ]);
};

const seed = async () => {
  await clearSeedCollections();

  // 1) Role module
  const [adminRole, teacherRole, studentRole, parentRole] = await Role.create([
    {
      name: "School Admin",
      code: "SCHOOL_ADMIN",
      type: "system",
      level: 90,
      permissions: [
        { module: "Students", actions: ["create", "read", "update", "delete"] },
        { module: "Attendance", actions: ["create", "read", "update"] },
      ],
    },
    {
      name: "Teacher",
      code: "TEACHER",
      type: "system",
      level: 50,
      permissions: [
        { module: "Students", actions: ["read"] },
        { module: "Attendance", actions: ["create", "read", "update"] },
      ],
    },
    {
      name: "Student",
      code: "STUDENT",
      type: "system",
      level: 10,
      permissions: [{ module: "Profile", actions: ["read"] }],
    },
    {
      name: "Parent",
      code: "PARENT",
      type: "system",
      level: 10,
      permissions: [{ module: "Student Progress", actions: ["read"] }],
    },
  ]);

  // 2) School module
  const school = await School.create({
    name: "Sunrise Public School",
    email: "info@sunrisepublicschool.edu",
    phone: "+91-9876543210",
    address: "Sector 21, Noida",
    status: "active",
  });

  await Role.updateMany(
    { _id: { $in: [adminRole._id, teacherRole._id, studentRole._id, parentRole._id] } },
    { $set: { schoolId: school._id } }
  );

  // 3) Users module
  const [adminUser, teacherUser, fatherUser, studentUser] = await User.create([
    {
      name: "Admin User",
      email: "admin@sunrise.edu",
      password: "Admin@123",
      roleId: adminRole._id,
      schoolId: school._id,
      regId: "#000001",
      isEmailVerified: true,
    },
    {
      name: "Math Teacher",
      email: "teacher@sunrise.edu",
      password: "Teacher@123",
      roleId: teacherRole._id,
      schoolId: school._id,
      regId: "#000002",
      isEmailVerified: true,
    },
    {
      name: "Rohit Sharma",
      email: "father@sunrise.edu",
      password: "Parent@123",
      roleId: parentRole._id,
      schoolId: school._id,
      regId: "#000003",
      isEmailVerified: true,
    },
    {
      name: "Aarav Sharma",
      email: "student@sunrise.edu",
      password: "Student@123",
      roleId: studentRole._id,
      schoolId: school._id,
      regId: "#000004",
      isEmailVerified: true,
    },
  ]);

  await School.findByIdAndUpdate(school._id, { createdBy: adminUser._id });

  // 4) Academic Year module
  const academicYear = await AcademicYear.create({
    schoolId: school._id,
    startDate: new Date("2025-04-01"),
    endDate: new Date("2026-03-31"),
    isActive: true,
    status: "active",
  });

  await School.findByIdAndUpdate(school._id, { activeAcademicYearId: academicYear._id });

  // 5) Class + Board + BoardClass modules
  const class10 = await Class.create({
    name: "10",
    code: "X",
    description: "Class 10",
    isGlobal: true,
    createdBy: adminUser._id,
  });

  const cbseBoard = await Board.create({
    name: "CBSE",
    createdByRole: "Super Admin",
    createdBy: adminUser._id,
    description: "Central Board",
  });

  const boardClass = await BoardClass.create({
    boardId: cbseBoard._id,
    classId: class10._id,
    name: "CBSE Class 10",
    createdBy: adminUser._id,
  });

  // 6) SchoolClass + Section modules
  const schoolClass = await SchoolClass.create({
    name: "10",
    schoolId: school._id,
    academicYearId: academicYear._id,
    boardClassId: boardClass._id,
    createdBy: adminUser._id,
  });

  const sectionA = await Section.create({
    schoolId: school._id,
    schoolClassId: schoolClass._id,
    academicYearId: academicYear._id,
    name: "A",
    capacity: 50,
    classTeacherId: teacherUser._id,
    createdBy: adminUser._id,
  });

  // 7) Subject module
  const [mathSubject, scienceSubject] = await Subject.create([
    {
      name: "Mathematics",
      schoolId: school._id,
      category: "Core",
      type: "Theory",
      maxMarks: 100,
      passMarks: 33,
      createdBy: adminUser._id,
      assignedTeachers: [{ teacherId: teacherUser._id, schoolId: school._id }],
    },
    {
      name: "Science",
      schoolId: school._id,
      category: "Core",
      type: "Both",
      maxMarks: 100,
      passMarks: 33,
      createdBy: adminUser._id,
      assignedTeachers: [{ teacherId: teacherUser._id, schoolId: school._id }],
    },
  ]);

  // 8) Student + Enrollment modules
  const student = await Student.create({
    userId: studentUser._id,
    schoolId: school._id,
    dateOfBirth: new Date("2010-07-22"),
    gender: "Male",
    fatherId: fatherUser._id,
    fatherInfo: {
      name: fatherUser.name,
      mobile: "+91-9999988888",
      email: fatherUser.email,
    },
    address: "Noida, Uttar Pradesh",
  });

  const enrollment = await StudentEnrollment.create({
    studentId: student._id,
    schoolId: school._id,
    academicYearId: academicYear._id,
    registrationNumber: "SPS-2025-001",
    schoolClassId: schoolClass._id,
    sectionId: sectionA._id,
    createdBy: adminUser._id,
  });

  await Section.findByIdAndUpdate(sectionA._id, {
    $set: { studentEnrollmentIds: [enrollment._id], StudentEnrollmentId: [enrollment._id] },
    $push: {
      subjects: {
        $each: [
          { subjectId: mathSubject._id, teacherId: teacherUser._id },
          { subjectId: scienceSubject._id, teacherId: teacherUser._id },
        ],
      },
    },
  });

  // 9) Attendance module
  await Attendance.create([
    {
      schoolId: school._id,
      userId: studentUser._id,
      role: "student",
      schoolClassId: schoolClass._id,
      sectionId: sectionA._id,
      subjectId: mathSubject._id,
      date: new Date("2026-04-20"),
      status: "present",
      markedBy: teacherUser._id,
      remarks: "On time",
    },
    {
      schoolId: school._id,
      userId: teacherUser._id,
      role: "teacher",
      date: new Date("2026-04-20"),
      status: "present",
      markedBy: adminUser._id,
      remarks: "Assembly duty",
    },
  ]);

  // 10) Fees module (FeeHead + FeeStructure)
  const [tuitionFeeHead, examFeeHead] = await FeeHead.create([
    { schoolId: school._id, name: "Tuition Fee", type: "recurring" },
    { schoolId: school._id, name: "Exam Fee", type: "one-time" },
  ]);

  await FeeStructure.create([
    {
      schoolId: school._id,
      schoolClassId: schoolClass._id,
      academicYearId: academicYear._id,
      feeHeadId: tuitionFeeHead._id,
      amount: 2500,
      frequency: "monthly",
      createdBy: adminUser._id,
      installments: [
        { month: "April", amount: 2500 },
        { month: "May", amount: 2500 },
      ],
    },
    {
      schoolId: school._id,
      schoolClassId: schoolClass._id,
      academicYearId: academicYear._id,
      feeHeadId: examFeeHead._id,
      amount: 1500,
      frequency: "yearly",
      createdBy: adminUser._id,
      installments: [{ month: "October", amount: 1500 }],
    },
  ]);

  // 11) Exam module
  await Exam.create({
    schoolId: school._id,
    academicYearId: academicYear._id,
    title: "Unit Test - Mathematics",
    schoolClassId: schoolClass._id,
    sectionId: sectionA._id,
    subjectId: mathSubject._id,
    examType: "Unit Test",
    examDate: new Date("2026-05-10"),
    startTime: new Date("2026-05-10T09:00:00.000Z"),
    endTime: new Date("2026-05-10T10:00:00.000Z"),
    durationMinutes: 60,
    totalMarks: 40,
    passingMarks: 14,
    createdBy: teacherUser._id,
    status: "published",
  });

  // 12) Inventory module
  await Inventory.create({
    schoolId: school._id,
    academicYearId: academicYear._id,
    itemType: "supply",
    name: "Whiteboard Marker",
    category: "Classroom",
    quantity: 120,
    allocated: 25,
    location: "Store Room - A",
    minThreshold: 20,
  });

  // 13) Library module (Books + IssuedBooks)
  const book = await Book.create({
    title: "NCERT Mathematics Class 10",
    author: "ncert",
    publisher: "ncert",
    isbn: "9789380000011",
    category: "academics",
    totalCopies: 30,
    availableCopies: 29,
    shelfLocation: "RACK-10-A",
    schoolId: school._id,
    academicYearId: academicYear._id,
  });

  await IssuedBook.create({
    bookId: book._id,
    studentId: student._id,
    schoolId: school._id,
    academicYearId: academicYear._id,
    issueDate: new Date("2026-04-18"),
    dueDate: new Date("2026-05-18"),
    status: "Issued",
  });

  console.log("\n🎉 Seed data inserted successfully for core school-management modules.");
  console.log("School:", school.name);
  console.log("Academic Year:", academicYear.name);
  console.log("Student Enrollment:", enrollment.registrationNumber);
};

(async () => {
  try {
    await connectDb();
    await seed();
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
})();

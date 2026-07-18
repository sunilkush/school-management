import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema(
  {
    // Link with User model
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // Multi-school support
    schoolId: { 
      type: Schema.Types.ObjectId, 
      ref: "School", 
      required: true 
    },
    academicYearId: { 
      type: Schema.Types.ObjectId, 
      ref: "AcademicYear", 
    },

    // Basic Info
    phoneNo: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[0-9]{10,13}$/, "Invalid phone number"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    dateOfBirth: {
      type: Date,
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    religion: {
      type: String,
      enum: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"],
    },
    // Address
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // ID Proof
    idProof: {
      type: String,
      default: null,
    },

    citizenAddress: {
      type: String,
      maxlength: 200,
      default: null,
    },
    // Employment
    employeeCode: {
      type: String,
      trim: true,
      index: true,
    },
    schoolMappings: [
      {
        schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
        role: { type: String, trim: true, default: "Employee" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    department: { 
      type: String 
    }, // or ObjectId ref if you want separate Department collection
    designation: { 
      type: String 
    }, // or ObjectId ref
    employmentType: {
      type: String,
      enum: ["Permanent", "Contract", "Part Time", "Full Time", "Intern"],
      default: "Permanent",
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required"],
    },
    shift: {
      name: { type: String, trim: true },
      startTime: { type: String, trim: true },
      endTime: { type: String, trim: true },
      weeklyOffs: { type: [String], default: [] },
    },
    workLocation: { type: String, trim: true },
    reportingManager: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    
    // Salary
    salaryId: {
      type: Schema.Types.ObjectId,
      ref: "PayrollStructure",
      default: null,
    },

    // Teacher-specific fields
    experience: {
      type: Number, // in years
      min: 0,
      default: 0,
    },
    qualification: {
      type: [String],
      default: [],
    },
    subjects: [
      {
        type: Schema.Types.ObjectId, // array of ObjectId
        ref: "Subject",
      },
    ],
    // Banking Details (Salary Credit ke liye)
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      panNumber: String,
      aadhaarNumber: String,
      uanNumber: String,
      pfNumber: String,
      esiNumber: String,
    },
    // Statutory compliance (EPF/ESI) — identity/reference fields only. Whether PF/ESI actually
    // applies is a single on/off toggle on the salary structure (payrollStructure.model.js);
    // it used to be duplicated here too as an "override", but that just meant PF/ESI could be
    // configured from two different screens with no clear precedence between them.
    statutoryCompliance: {
      uan: {
        type: String,
        trim: true,
        match: [/^\d{12}$/, "UAN must be exactly 12 digits"],
        default: null,
      },
      pfJoiningDate: { type: Date, default: null },
      pfExitDate: { type: Date, default: null },
      // VPF % lives only on PayrollStructure (payrollStructure.model.js) — it's tied to a
      // specific salary-structure revision, not a permanent employee attribute, and having it
      // here too meant the calculation engine silently ignored whatever was set on this copy.
      pfCategory: {
        type: String,
        enum: ["general", "international_worker", "excluded"],
        default: "general",
      },
      esicNumber: {
        type: String,
        trim: true,
        match: [/^\d{10,17}$/, "ESIC number must be 10-17 digits"],
        default: null,
      },
      esiJoiningDate: { type: Date, default: null },
      esiCategory: {
        type: String,
        enum: ["general", "disability", "excluded"],
        default: "general",
      },
    },
    documents: [
      {
        type: { type: String, trim: true, required: true },
        url: { type: String, trim: true, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    salaryHistory: [
      {
        payrollStructureId: { type: Schema.Types.ObjectId, ref: "PayrollStructure" },
        effectiveFrom: Date,
        grossMonthly: Number,
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        reason: { type: String, trim: true },
      },
    ],
    // Common
    notes: {
      type: String,
      maxlength: 500,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A `sparse` compound index only skips a document if *every* indexed field is missing — since
// schoolId is always present, "sparse" here never actually excluded an employee with no
// employeeCode, so a second employee added without one collided as a duplicate (schoolId, null)
// pair. A partial index scoped to "employeeCode actually set" is what "optional but unique
// when present" requires for a compound index.
employeeSchema.index(
  { schoolId: 1, employeeCode: 1 },
  { unique: true, partialFilterExpression: { employeeCode: { $exists: true, $type: "string" } }, name: "schoolId_1_employeeCode_1_partial" }
);

export const Employee = mongoose.model("Employee", employeeSchema);

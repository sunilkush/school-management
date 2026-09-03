import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    /* ===========================
       👤 STUDENT USER LINK
    ============================ */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one user = one student
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      index: true,
      default: null,
    },
    /* ===========================
       📸 BASIC INFO
    ============================ */
    picture: {
      type: String,
      default: null,
    },

    /* ===========================
       📎 ADMISSION DOCUMENTS
    ============================ */
    documents: {
      type: [
        {
          name: { type: String, trim: true },
          url: { type: String, required: true },
          mimeType: { type: String, trim: true },
          publicId: { type: String, trim: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    dateOfBirth: {
      type: Date,
      index: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    religion: {
      type: String,
      trim: true,
    },

    cast: {
      type: String,
      trim: true,
    },

    bloodGroup: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    identificationMark: {
      type: String,
      trim: true,
    },

    /* ===========================
       👨‍👩‍👧 PARENTS (REFERENCE BASED)
    ============================ */

    fatherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    motherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // Optional (future proof)
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fatherInfo: {
      name: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },

    motherInfo: {
      name: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },

    /* ===========================
       🟣 OTHER INFO
    ============================ */

    orphan: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    family: {
      type: String,
      trim: true,
    },

    disease: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    siblings: {
      type: String,
      trim: true,
    },

    /**
     * Government identifiers and reservation status, kept together because they are only ever
     * needed together — at UDISE+ filing time and for RTE reporting.
     *
     * Note what is NOT here: the full Aadhaar number. This system's job is to tell the office
     * which children are still missing a document, not to become a parallel Aadhaar database —
     * holding lakhs of full numbers is a liability a school does not need, and the number itself
     * gets typed into the government portal from the physical document anyway. The last four
     * digits are enough to match a record against the card in hand.
     */
    compliance: {
      /** Permanent Education Number — 11 digits, issued through UDISE+. */
      pen: { type: String, trim: true, default: "" },
      /** APAAR / "One Nation One Student ID" — 12 digits. */
      apaarId: { type: String, trim: true, default: "" },
      /**
       * APAAR cannot be created without a parent's consent, so the consent is the compliance
       * artefact — an id recorded without it is a problem, not an achievement.
       */
      apaarConsent: {
        given: { type: Boolean, default: false },
        givenAt: { type: Date, default: null },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
      aadhaarLast4: { type: String, trim: true, default: "" },
      aadhaarOnFile: { type: Boolean, default: false },
      /** UDISE+ social category. Kept separate from the free-text `cast` field above, which
       *  records the actual caste and is not what the return asks for. */
      socialCategory: {
        type: String,
        enum: ["General", "OBC", "SC", "ST", "Other", ""],
        default: "",
      },
      minorityGroup: {
        type: String,
        enum: ["None", "Muslim", "Christian", "Sikh", "Buddhist", "Parsi", "Jain", ""],
        default: "",
      },
      /** Children with special needs — a mandatory UDISE+ field, and it drives entitlements. */
      cwsn: { type: Boolean, default: false },
      cwsnType: { type: String, trim: true, default: "" },
      bplCard: { type: Boolean, default: false },
      /** Admitted against the RTE 25% quota — the basis of a school's reimbursement claim. */
      rteAdmission: { type: Boolean, default: false },
      rteCategory: {
        type: String,
        enum: ["EWS", "Disadvantaged Group", "Other", ""],
        default: "",
      },
      motherTongue: { type: String, trim: true, default: "" },
      updatedAt: { type: Date, default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    previousSchool: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "alumni", "transferred"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   🔥 INDEXES (PERFORMANCE)
=========================== */

// fast lookup
studentSchema.index({ fatherId: 1 });
studentSchema.index({ motherId: 1 });

// optional search
studentSchema.index({ dateOfBirth: 1 });
studentSchema.index({ schoolId: 1, status: 1 });

// A PEN or an APAAR id belongs to exactly one child. Partial so the vast majority of records,
// which have neither yet, do not all collide on the empty string.
studentSchema.index(
  { schoolId: 1, "compliance.pen": 1 },
  { unique: true, partialFilterExpression: { "compliance.pen": { $type: "string", $gt: "" } } }
);
studentSchema.index(
  { schoolId: 1, "compliance.apaarId": 1 },
  { unique: true, partialFilterExpression: { "compliance.apaarId": { $type: "string", $gt: "" } } }
);
// Drives the readiness report — "who is still missing something".
studentSchema.index({ schoolId: 1, "compliance.rteAdmission": 1 });
export const Student = mongoose.model("Student", studentSchema);

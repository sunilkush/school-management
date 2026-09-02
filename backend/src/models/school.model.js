import mongoose, { Schema } from "mongoose";

/* ================= HELPERS ================= */

const slugify = (text) =>
  text
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ================= SCHEMA ================= */

const schoolSchema = new Schema(
  {
    /* ================= BASIC INFO ================= */

    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // ✅ allows null safely
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    email: {
      type: String,
      required: [true, "School email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-() ]*$/, "Invalid phone number"],
    },

    website: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Whether this school accepts online admission applications. updateSchool already reads and
    // writes it, so without the field here Mongoose's strict mode silently dropped every write.
    // Inert on its own — the public admission portal that consumes it lands separately; a school
    // closes intake with this rather than by going inactive, which disables the whole tenant.
    admissionsOpen: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    /* ================= PAYMENT MODE ================= */

    razorpay: {
      keyId: {
        type: String,
        select: false,
      },
      keySecret: {
        type: String,
        select: false,
      },
      // Separate from keySecret — the secret Razorpay issues specifically for webhook payload
      // signature verification (configured per-account in the Razorpay Dashboard's Webhooks
      // section), used by webhook.controllers.js to confirm a fee-payment webhook actually
      // came from Razorpay for this school's account.
      webhookSecret: {
        type: String,
        select: false,
      },
      accountId: String,
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },

    bank: {
      accountHolder: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC"],
      },
      bankName: { type: String, trim: true },
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },

    /* ================= ACADEMIC ================= */

    activeAcademicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      index: true,
    },
    /* ================= GPS / GEOFENCE ================= */

    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      geofenceRadius: { type: Number, default: 200 }, // metres
      address: { type: String, trim: true, default: "" },
    },

    /* ================= ATTENDANCE HOURS ================= */
    // Drives the daily auto-checkout job (see jobs/autoCheckout.job.js) — anyone still
    // checked in (checkInAt set, checkOutAt null) once "now" (Asia/Kolkata) passes endTime
    // gets automatically checked out. startTime is informational for now (e.g. for a future
    // "late" cutoff); only endTime is currently consumed.
    attendanceHours: {
      startTime: { type: String, trim: true, default: "08:00" }, // "HH:mm", 24-hour
      endTime: { type: String, trim: true, default: "15:00" },   // "HH:mm", 24-hour
      autoCheckoutEnabled: { type: Boolean, default: true },
    },

    /* ================= META ================= */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deletedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ================= INDEXES ================= */

// Fast search
schoolSchema.index({ name: "text" });

// Ensure unique email among non-deleted docs
schoolSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

// Ensure unique slug among non-deleted docs
schoolSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

/* ================= MIDDLEWARE ================= */

// Auto slug generate + collision safe
schoolSchema.pre("validate", async function (next) {
  if (!this.slug && this.name) {
    let baseSlug = slugify(this.name);
    let slug = baseSlug;
    let counter = 1;

    const Model = this.constructor;

    while (
      await Model.exists({
        slug,
        _id: { $ne: this._id },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
  }
  next();
});

// Prevent enabling both payment modes incorrectly (optional rule)
schoolSchema.pre("save", function (next) {
  if (this.razorpay?.isEnabled && !this.razorpay?.keyId) {
    return next(
      new Error("Razorpay keyId required when Razorpay is enabled")
    );
  }
  next();
});

/* ================= STATIC METHODS ================= */

// Soft delete helper
schoolSchema.statics.softDeleteById = function (id, userId) {
  return this.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    updatedBy: userId,
    isActive: false,
    status: "inactive",
  });
};

/* ================= MODEL ================= */

export const School = mongoose.model("School", schoolSchema);


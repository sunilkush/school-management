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
      minlength: 2,
      maxlength: 120,
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

    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
      },
    ],

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
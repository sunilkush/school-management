import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
    {
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "School",
            required: true,
            index: true,
        },

        schoolClassId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SchoolClass",
            required: true,
            index: true,
        },

        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicYear",
            required: true,
            index: true,
        },

        feeHeadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FeeHead",
            required: true,
            index: true,
        },

        // The charge for ONE period of `frequency`: Tuition ₹2,000 monthly is ₹2,000 every month,
        // ₹24,000 for the year. (Before migrateFeesToPerPeriod.mjs this held the whole year's
        // total instead.)
        amount: {
            type: Number,
            required: true,
            min: [0, "Amount cannot be negative"],
        },

        // Keep in step with FEE_FREQUENCIES in services/feeSchedule.service.js.
        frequency: {
            type: String,
            enum: ["monthly", "quarterly", "half_yearly", "yearly", "one_time"],
            required: true,
        },

        // Marks a structure whose amount is already per period. The migration only converts
        // documents without it, so running it twice cannot divide an amount twice. Deliberately
        // no default: Mongoose would write a default into an old document the first time it was
        // saved, and the migration would then skip a record it still needed to convert.
        // createFeeStructure sets it explicitly.
        amountBasis: {
            type: String,
            enum: ["per_period"],
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // A student's per-period schedule lives in the FeeInstallment collection, generated when
        // the fee is assigned (services/feeSchedule.service.js).
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/* ================= INDEX ================= */

// ✅ Prevent duplicate entry
feeStructureSchema.index(
    {
        schoolId: 1,
        schoolClassId: 1,
        academicYearId: 1,
        feeHeadId: 1,
    },
    {
        unique: true,
    }
);

/* ================= SAFE EXPORT ================= */

export const FeeStructure =
    mongoose.models.FeeStructure ||
    mongoose.model("FeeStructure", feeStructureSchema);
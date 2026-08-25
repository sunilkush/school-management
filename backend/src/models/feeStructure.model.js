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

        amount: {
            type: Number,
            required: true,
            min: [0, "Amount cannot be negative"],
        },

        frequency: {
            type: String,
            enum: ["monthly", "quarterly", "yearly"],
            required: true,
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
        // Real installment breakdown lives in the separate FeeInstallment collection
        // (generated per-student via feeInstallment.controllers.js) — this embedded array was
        // never written to by anything.
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
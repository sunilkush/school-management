import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true, // e.g., "Student Management", "Attendance", "Reports"
    },
    actions: [
      {
        type: String,
        enum: [
          "create",
          "read",
          "update",
          "delete",
          "export",
          "approve",
          "collect", // added
          "return",  // added
          "assign",  // added
        ],
      },
    ],
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g., "Super Admin", "School Admin", "Teacher"
    },
    code: {
      type: String,
      trim: true,
      unique: false, // ❌ can't be globally unique if school-specific
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["system", "custom"], // system roles are pre-defined and cannot be deleted
      default: "custom",
    },
    level: {
      type: Number,
      default: 1, // hierarchy level (Super Admin > Admin > Teacher > Student)
    },
    permissions: [permissionSchema], // array of module-permission mapping

    // 🔗 Role belongs to a school (null = global/system role)
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Ensure unique role name + school
roleSchema.index({ name: 1, schoolId: 1 }, { unique: true });

// ✅ Ensure unique role code + school
roleSchema.index({ code: 1, schoolId: 1 }, { unique: true });

export const Role = mongoose.model("Role", roleSchema);

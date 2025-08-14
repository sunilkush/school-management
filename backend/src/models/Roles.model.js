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
        enum: ["create", "read", "update", "delete", "export", "approve"], // extendable
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
      unique: true,
      trim: true, // e.g., "Super Admin", "School Admin", "Teacher"
    },
    code: {
      type: String,
      trim: true,
      unique: true, // short form for internal use e.g., "SA", "ADMIN", "TEACH"
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
      default: 1, // for hierarchy (Super Admin > Admin > Teacher > Student)
    },
    permissions: [permissionSchema], // array of module-permission mapping
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null, // null means it's a global/system role
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

export const Role = mongoose.model("Role", roleSchema);

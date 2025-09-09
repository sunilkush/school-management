import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema({
  // Link to user account
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

  // Basic Info
  fullName: {
    type: String,
    required: true
  },
  phoneNo: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  education: {
    type: String
  },
  experience: {
    type: String
  },
  // Address
  address: {
    street: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    zipCode: {
      type: String
    },
    country: {
      type: String
    },
  },

  // Job Details
  department: {
    type: String,
    required: true,
    lowercase: true
  },
  designation: {
    type: String,
    required: true,
    lowercase: true
  },
  employmentType: {
    type: String,
    enum: ["Full-Time", "Part-Time", "Contract"],
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },

  // Salary
  salary: {
    basicPay: {
      type: Number,
      required: true
    },
    allowances: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    }, // will be calculated in pre-save hook
  },

  // Teacher-specific fields
  assignedClasses: [
    {
      classId: {
        type: Schema.Types.ObjectId,
        ref: "Class"
      },
      subjects: [
        { type: String }
      ], // multiple subjects if needed
      schedule: [
        {
          day: {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          },
          startTime: {
            type: String
          },
          endTime: {
            type: String
          },
        },
      ],
    },
  ],

  // Optional notes / extra info
  notes: { type: String },

}, { timestamps: true });

/**
 * Pre-save hook to calculate net salary
 */
employeeSchema.pre("save", function (next) {
  if (this.salary) {
    const { basicPay, allowances = 0, deductions = 0 } = this.salary;
    this.salary.netSalary = basicPay + allowances - deductions;
  }
  next();
});

/**
 * Index for multi-school uniqueness (phone number per school)
 */
employeeSchema.index({ schoolId: 1, phoneNo: 1 }, { unique: true });

export const Employee = mongoose.model("Employee", employeeSchema);

import mongoose, { Schema } from "mongoose";
const employeeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // employee details
    phoneNo: {
        type: String,
        required: true,
        unique: true
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
    // Additional Information
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
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
    joinDate: {
        type: Date,
        required: true
    },
    employmentType: {
        type: String,
        enum: ["Full-Time", "Part-Time", "Contract"],
        required: true
    },
    // Salary Details
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
            default: function () {
                return this.salary.basicPay + this.salary.allowances - this.salary.deductions;
            },
        },
    },
    assignedClasses: [
        {
            classId: {
                type: Schema.Types.ObjectId,
                ref: "Classes"
            },
            subject: {
                type: String,
                required: true
            },
            schedule: [
                {
                    day: {
                        type: String,
                        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                        required: true
                    },
                    startTime: {
                        type: String,
                        required: true
                    }, // e.g., "09:00 AM"
                    endTime: {
                        type: String,
                        required: true
                    },   // e.g., "10:30 AM"
                }
            ],
        }
    ],
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    },

}, { timestamps: true })

export const Employee = mongoose.model("Employees", employeeSchema)
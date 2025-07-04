import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        registrationNumber: {
            type: String,
            unique: true,
        },
        class: {
            type: Schema.Types.ObjectId,
            ref: "Classes",
            required: true,
        },
       
        admissionDate: {
            type: Date,
            default: Date.now,
        },
        feeDiscount: {
            type: Number, // percent discount
        },
        smsMobile: {
            type: String,
        },
        otherInfo: {
            dateOfBirth: {
                type: Date,
            },
            birthFormId: {
                type: String,
            },
            orphan: {
                type: String,
                enum: ["Yes", "No"],
            },
            gender: {
                type: String,
                enum: ["Male", "Female", "Other"],
            },
            cast: {
                type: String,
            },
            osc: {
                type: String,
            },
            identificationMark: {
                type: String,
            },
            previousSchool: {
                type: String,
            },
            religion: {
                type: String,
            },
            bloodGroup: {
                type: String,
            },
            previousId: {
                type: String,
            },
            family: {
                type: String,
            },
            disease: {
                type: String,
            },
            notes: {
                type: String,
            },
            siblings: {
                type: Number,
            },
            address: {
                type: String,
            },
        },
        fatherInfo: {
            name: {
                type: String,
            },
            nationalId: {
                type: String,
            },
            occupation: {
                type: String,
            },
            education: {
                type: String,
            },
            mobile: {
                type: String,
            },
            profession: {
                type: String,
            },
            income: {
                type: String,
            },
        },
        motherInfo: {
            name: {
                type: String,
            },
            nationalId: {
                type: String,
            },
            occupation: {
                type: String,
            },
            education: {
                type: String,
            },
            mobile: {
                type: String,
            },
            profession: {
                type: String,
            },
            income: {
                type: String,
            },
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        schoolId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Schools", // or your actual school model name
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Student = mongoose.model("Student", studentSchema);

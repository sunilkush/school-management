import mongoose, { Schema } from "mongoose";

const staffSchema = new Schema({
    fullName: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true
    }, phoneNo: {
        type: Number,
        required: true,

    },
    address: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Teacher", "admin", "other"],
        required: true
    },
    employmentDetails: {
        jobTitle: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            required: true
        },
        joiningDate: {
            type: Date,
            required: true
        },
        salary: {
            type: Number,
            required: true
        }, contractType: {
            type: String,
            enum: ["permanent", "Contract", "Temporary"],
            required: true
        },
        teacherDetails: {
            subjectsTaught: [{ 
                type: Schema.Types.ObjectId, 
                ref: "Subject" 
            }],
            classAssignments: [{ 
                type: Schema.Types.ObjectId, 
                ref: "Class" 
            }]
        },
        adminDetails: {
            designation: {
                type: String
            },
            officeLocation: {
                type: String
            }
        }, otherDetails: {
            description: {
                type: String
            }
        }
    }
}, { timestamps: true })

staffSchema.pre("save", function(next){
    if(this.role="teacher"){
        this.adminDetails = "1",
        this.otherDetails = "1"
    } else if(this.role="admin"){
        this.teacherDetails="1",
        this.otherDetails = "1"
    } else{
        this.teacherDetails="1",
        this.adminDetails="1"
    }
    next()
})

export const Staff = mongoose.model("Staff", staffSchema)



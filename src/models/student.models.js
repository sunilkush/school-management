import mongoose,{Schema} from "mongoose";
const studentSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: new Date(),
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    admissionId: {
        type: Schema.Types.ObjectId,
        ref: 'Admission'
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: 'Class'
    },
    phone: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
    },
    parents: {
        fatherName: String,
        motherName: String,
        guardianContact: String,
    },
    hostelId: {
        type: Schema.Types.ObjectId,
        ref: "hostel"
    },
    transportId: {
        type: Schema.Types.OjectId,
        ref: "Transportation",
    },
    alumni: { 
        type: Boolean, 
        default: false 
    },
    feeIds: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Fee' 
    }],
    examIds:[{
        type:Schema.Types.ObjectId,
        ref:"Exam"
    }],
    issuedBooks:[{
        type:Schema.Types.ObjectId,
        ref:"Book"
    }]
}, { timestamps: true })

export const Student = mongoose.model("Students", studentSchema)
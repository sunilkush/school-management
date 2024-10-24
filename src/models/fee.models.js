import mongoose,{Schema} from "mongoose";

const feeSchema = new Schema({
    studentId: {
        type: String,
        required: true,
    },
    feeType: {
        type: String,
        required: true,
        enum: ['Tuition', 'Library', 'Hostel', 'Transport'],
    },
    amount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Pending'
    }
},)

export const Fee = mongoose.model("Fee", feeSchema) 
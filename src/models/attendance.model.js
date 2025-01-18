import mongoose,{Schema} from "mongoose";

const attendanceSchema = new Schema({
  date: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["present", "absent", "leave"], required: true },
},{timestamps:true});

export const Attendance = mongoose.model("Attendances",attendanceSchema)
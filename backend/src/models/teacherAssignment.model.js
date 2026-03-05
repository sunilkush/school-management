import mongoose,{Schema} from "mongoose";
const teacherSchema = new Schema({
  teacherId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
},
  schoolId: { 
    type: Schema.Types.ObjectId, 
    ref: "School", 
    required: true 
},
  academicYearId: { 
    type: Schema.Types.ObjectId, 
    ref: "AcademicYear", 
    required: true 
},
  schoolClassId: { 
    type: Schema.Types.ObjectId, 
    ref: "SchoolClass"  
},
  subjectId: { 
    type: Schema.Types.ObjectId,
     ref: "Subject" 
    },
}, { timestamps: true });

export const Teacher = mongoose.model("Teacher",teacherSchema)
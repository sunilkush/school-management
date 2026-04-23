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
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: "Section",
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
}, { timestamps: true });

teacherSchema.index(
  { schoolId: 1, academicYearId: 1, teacherId: 1, schoolClassId: 1, subjectId: 1, sectionId: 1 },
  { unique: true }
);
teacherSchema.index({ schoolId: 1, academicYearId: 1, subjectId: 1, status: 1 });

export const Teacher = mongoose.model("Teacher",teacherSchema)
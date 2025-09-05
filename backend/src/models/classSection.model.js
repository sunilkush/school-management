import mongoose from "mongoose";
const classSectionSchema = new mongoose.Schema({
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true },
  sectionId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
},
  academicYearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AcademicYear', 
    required: true 
}
});

classSectionSchema.index(
  { classId: 1, sectionId: 1, academicYearId: 1, schoolId: 1 },
  { unique: true }
);

export const ClassSection = mongoose.model("ClassSection",classSectionSchema)

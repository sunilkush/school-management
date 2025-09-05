import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },

  academicYearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AcademicYear', 
    required: true 
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },

  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  }

}, { timestamps: true });

// Prevent duplicate section names per school + year
sectionSchema.index({ name: 1, schoolId: 1, academicYearId: 1 }, { unique: true });

export const Section = mongoose.model('Section', sectionSchema);

import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Teacher', 'Student', 'Parent', 'Accountant', 'Staff'],
    required: true
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  browser: {
    type: String
  },
  os: {
    type: String
  },
  location: {
    type: String
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster querying by userId and loginTime
export const LoginLog = mongoose.model('LoginLog', loginLogSchema);
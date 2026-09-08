import mongoose from 'mongoose';

/**
 * A record that somebody signed in.
 *
 * schoolId and academicYearId are deliberately optional. They were both required, and the effect
 * was that no login was ever recorded at all: User.academicYearId defaults to null, so every
 * insert failed validation, and the failure is swallowed by a try/catch so that a logging problem
 * can never stop somebody signing in. Login worked; the audit trail was silently empty. A Super
 * Admin has no school either, so the one login most worth recording was the one most certain to
 * be dropped.
 *
 * The rule to keep: an audit record is never discarded over a field that is incidental to the
 * event it describes. Who signed in, from where, and when is the record. Which academic year that
 * fell in is useful context, and context does not get a veto.
 */
const loginLogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    trim: true,
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
    default: null
  }
}, {
  timestamps: true
});
loginLogSchema.index({ userId: 1, loginTime: -1 });
// Index for faster querying by userId and loginTime
export const LoginLog = mongoose.model('LoginLog', loginLogSchema);
// models/ReportFilters.js

const mongoose = require('mongoose');

const ReportFiltersSchema = new mongoose.Schema({
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true,
  },

  // Supports multi-school comparisons
  schoolIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
  ],

  // Support filtering by user role
  userRoles: [
    {
      type: String,
      enum: ['Super Admin', 'School Admin', 'Teacher', 'Student', 'Parent', 'Accountant', 'Staff'],
    },
  ],

  // Filter by student demographics or staff assignment
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },

  category: {
    type: String,
    enum: ['General', 'OBC', 'SC', 'ST', 'EWS'],
  },

  religion: {
    type: String,
  },

  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },

  disability: {
    type: Boolean,
  },

  // Academic filters
  classIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classes',
    },
  ],

  sectionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
  ],

  subjects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
  ],

  // Time range filter for date-based reports (e.g., attendance, admissions, fee payments)
  fromDate: {
    type: Date,
  },

  toDate: {
    type: Date,
  },

  // Status filter (active/inactive/terminated)
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Terminated'],
  },

  // Fee-specific filters (if financial reporting is included)
  feeType: {
    type: String,
    enum: ['Admission', 'Tuition', 'Transport', 'Hostel', 'Other'],
  },

  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partial'],
  },

  // Export options
  exportFormat: {
    type: String,
    enum: ['PDF', 'Excel', 'CSV'],
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

export const ReportFilters = mongoose.model('ReportFilters', ReportFiltersSchema);

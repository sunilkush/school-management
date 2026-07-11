import React from 'react';
import { ExamListSection } from './ExamListSection';
import { useAuth } from '../../hooks/useAuth';

/** Read-only exam list — creating/scheduling exams, the paper builder, admit cards/seat plan,
 * marks entry and evaluation are all deferred (see apiSlice.js's getExams comment). */
export function TeacherExamsView() {
  const { user } = useAuth();
  return <ExamListSection academicYearId={user?.academicYear?._id} />;
}

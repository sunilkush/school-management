import React from 'react';
import { ExamListSection } from './ExamListSection';
import { useAuth } from '../../hooks/useAuth';
import { useGetActiveAcademicYearQuery } from '../../store/api/apiSlice';

/** Read-only exam list — creating/scheduling exams, the paper builder, admit cards/seat plan,
 * marks entry and evaluation are all deferred (see apiSlice.js's getExams comment). */
export function TeacherExamsView() {
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  return <ExamListSection academicYearId={activeYearQuery.data?._id} />;
}

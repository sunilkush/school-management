import React from 'react';
import { QueryState } from '../../components/ui/QueryState';
import { useGetMyEnrollmentQuery } from '../../store/api/apiSlice';
import { FeesContent } from './FeesContent';

export function StudentFeesView() {
  const { data, isLoading, isError, error, refetch } = useGetMyEnrollmentQuery();

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={!data?.studentId}
      emptyIcon="school-outline"
      emptyLabel="No enrollment found on your profile yet"
    >
      <FeesContent studentId={data?.studentId} academicYearId={data?.academicYear?._id} />
    </QueryState>
  );
}

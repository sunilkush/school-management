import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { avatarColorFor } from '../../theme/patterns';
import { FeesContent } from './FeesContent';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetStudentsListQuery } from '../../store/api/apiSlice';

/** Mirrors frontend/src/pages/Accountant/Fees_Management/CollectFees.jsx: search for a student,
 * then reuse the same fee-summary/installments/pay plumbing already built for Student/Parent
 * (GET /student-fees/my, GET /fee-installments, POST /payments) rather than a separate endpoint —
 * the backend already allows Accountant to call these on any student's behalf. */
export function AccountantFeesView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const listQuery = useGetStudentsListQuery({ page: 1, limit: 20 }, { skip: !search.trim() });
  const students = (listQuery.data?.students ?? []).filter((s) => s.studentName?.toLowerCase().includes(search.trim().toLowerCase()));

  if (selectedStudent) {
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>
            {selectedStudent.studentName}
          </Text>
          <Button mode="text" onPress={() => setSelectedStudent(null)}>
            Change Student
          </Button>
        </View>
        <FeesContent studentId={selectedStudent.studentId} academicYearId={academicYearId} />
      </View>
    );
  }

  return (
    <View>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search student by name to collect fees" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        isEmpty={!search.trim() || students.length === 0}
        emptyIcon="cash-search"
        emptyLabel={search.trim() ? 'No students match that name' : 'Search for a student to collect their fees'}
      >
        {students.map((s) => (
          <AccentListCard
            key={s._id}
            accent={avatarColorFor(s.studentName).color}
            avatar={<AvatarInitials name={s.studentName} size={40} />}
            title={s.studentName}
            subtitle={s.className ? `${s.className} · ${s.registrationNumber ?? ''}` : s.registrationNumber}
            onPress={s.studentId ? () => setSelectedStudent(s) : undefined}
          />
        ))}
      </QueryState>
    </View>
  );
}

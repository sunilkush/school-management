import React, { useState } from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { CollectFeeSheet } from './finance/CollectFeeSheet';
import { avatarColorFor } from '../theme/patterns';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetStudentsBySchoolQuery } from '../store/api/apiSlice';

/** Search a student, then collect a payment against one of their StudentFee records — mirrors
 * frontend/src/pages/Accountant/Fees_Management/CollectFees.jsx. Uses the simpler StudentFee
 * ledger (assigned via School Admin's Assign Fees screen), not the FeeInstallment/Razorpay system. */
export function FeeCollectionScreen() {
  const { spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetStudentsBySchoolQuery({ search: search.trim() || undefined });
  const students = (data ?? []).map((row) => ({
    enrollmentId: row._id,
    studentId: row.studentId,
    name: row.user?.name ?? 'Unknown',
    email: row.user?.email ?? '',
    registrationNumber: row.registrationNumber,
    className: row.schoolClass?.name,
    sectionName: row.section?.name,
  }));

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: spacing.md }}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or email" />
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={students.length === 0}
        emptyIcon="account-search-outline"
        emptyLabel="No students found"
      >
        {students.map((s) => (
          <AccentListCard
            key={s.enrollmentId}
            accent={avatarColorFor(s.name).color}
            avatar={<AvatarInitials name={s.name} size={40} />}
            title={s.name}
            subtitle={`${s.className ?? ''}${s.sectionName ? ` · ${s.sectionName}` : ''}`}
            meta={s.registrationNumber ? [{ label: 'Registration', value: s.registrationNumber }] : []}
            onPress={() => setSelectedStudent(s)}
          />
        ))}
      </QueryState>

      <CollectFeeSheet visible={!!selectedStudent} onDismiss={() => setSelectedStudent(null)} student={selectedStudent} />
    </ScreenContainer>
  );
}

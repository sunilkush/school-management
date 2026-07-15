import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetAllUsersQuery, useGetIssuedBooksQuery, useGetStudentsBySchoolQuery } from '../store/api/apiSlice';

const STAFF_ROLES = new Set(['teacher', 'staff', 'accountant', 'hr']);

/** Library membership + borrowing stats — no dedicated "member" model exists server-side; this
 * combines the same 3 generic endpoints client-side that the web app's LibraryMembers.jsx does
 * (students-by-school, all-users filtered to staff roles, issued-books for per-member stats). */
export function MembersScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('students');
  const [search, setSearch] = useState('');

  const studentsQuery = useGetStudentsBySchoolQuery({ search: search.trim() || undefined }, { skip: tab !== 'students' });
  const staffQuery = useGetAllUsersQuery({}, { skip: tab !== 'staff' });
  const issuedQuery = useGetIssuedBooksQuery();
  const issuedBooks = issuedQuery.data ?? [];

  const statsFor = (memberId) => {
    const records = issuedBooks.filter((r) => (r.studentId?._id ?? r.issuedToUserId?._id) === memberId);
    return {
      activeIssued: records.filter((r) => r.status === 'Issued' || r.status === 'Overdue').length,
      overdueCount: records.filter((r) => r.status === 'Overdue').length,
      pendingFine: records.filter((r) => r.fineStatus === 'Pending').reduce((sum, r) => sum + (r.fine || 0), 0),
    };
  };

  const students = useMemo(
    () =>
      (studentsQuery.data ?? []).map((row) => ({
        id: row.studentId,
        name: row.user?.name ?? 'Unknown',
        email: row.user?.email ?? '',
        subtitle: `${row.schoolClass?.name ?? ''}${row.section?.name ? ` · ${row.section.name}` : ''}`,
      })),
    [studentsQuery.data]
  );

  const staff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (staffQuery.data ?? [])
      .filter((u) => STAFF_ROLES.has(u.role?.name?.trim()?.toLowerCase()))
      .filter((u) => !query || [u.name, u.email].some((f) => f?.toLowerCase?.().includes(query)))
      .map((u) => ({ id: u._id, name: u.name ?? 'Unknown', email: u.email ?? '', subtitle: u.role?.name ?? '' }));
  }, [staffQuery.data, search]);

  const members = tab === 'students' ? students : staff;
  const isLoading = tab === 'students' ? studentsQuery.isLoading : staffQuery.isLoading;
  const isFetching = tab === 'students' ? studentsQuery.isFetching : staffQuery.isFetching;
  const isError = tab === 'students' ? studentsQuery.isError : staffQuery.isError;
  const error = tab === 'students' ? studentsQuery.error : staffQuery.error;
  const refetch = tab === 'students' ? studentsQuery.refetch : staffQuery.refetch;

  const overallStats = useMemo(() => {
    const active = members.map((m) => statsFor(m.id));
    return {
      totalMembers: members.length,
      activeBorrowers: active.filter((s) => s.activeIssued > 0).length,
      overdue: active.reduce((sum, s) => sum + s.overdueCount, 0),
    };
  }, [members, issuedBooks]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-group-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Members</Text>
        </View>
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        style={{ marginBottom: spacing.md }}
        buttons={[
          { value: 'students', label: 'Students' },
          { value: 'staff', label: 'Staff' },
        ]}
      />

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Members" metric={{ label: 'Members', icon: 'account-group-outline', color: colors.primary, value: overallStats.totalMembers }} />
          <StatCard label="Active Borrowers" metric={{ label: 'Active Borrowers', icon: 'book-arrow-right-outline', color: '#2563EB', value: overallStats.activeBorrowers }} />
          <StatCard label="Overdue" metric={{ label: 'Overdue', icon: 'alert-outline', color: '#EF4444', value: overallStats.overdue }} />
        </StatGrid>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or email" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={members.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel="No members found"
      >
        {members.map((m) => {
          const stats = statsFor(m.id);
          return (
            <AccentListCard
              key={m.id}
              accent={stats.overdueCount > 0 ? '#EF4444' : colors.primary}
              avatar={<AvatarInitials name={m.name} size={40} />}
              title={m.name}
              subtitle={m.subtitle || m.email}
              meta={[
                { label: 'Active Loans', value: stats.activeIssued },
                { label: 'Overdue', value: stats.overdueCount },
                ...(stats.pendingFine > 0 ? [{ label: 'Pending Fine', value: formatCurrency(stats.pendingFine) }] : []),
              ]}
              expandable
            />
          );
        })}
      </QueryState>
    </ScreenContainer>
  );
}

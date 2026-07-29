import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { pillStyle } from '../../theme/patterns';
import { studentStatusColor } from '../../utils/studentStatus';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAssignedClassesQuery, useGetStudentsListQuery } from '../../store/api/apiSlice';

const PAGE_SIZE = 20;

// Exact colors from the web app's own Students table (frontend/src/pages/School_Admin/
// User_Management/StudentList.jsx) — Class pill teal, Section pill green — so the two apps read
// as the same product, not just similarly-shaped screens.
const CLASS_PILL_COLOR = '#14B8A6';
const SECTION_PILL_COLOR = '#22C55E';

function InlinePill({ color, label }) {
  const { typography } = useAppTheme();
  if (!label) return null;
  return (
    <View style={pillStyle(color)}>
      <Text style={[typography.caption, { color, fontWeight: '700', fontSize: 10.5 }]}>{label}</Text>
    </View>
  );
}

/**
 * Paginated, infinite-scrolling student directory for School Admin/Teacher/Principal/Vice
 * Principal — the roles GET /student/all's role middleware actually allows. Class/Section filters
 * are real server-side queries (reset to page 1); search only narrows what's already loaded, since
 * the backend endpoint has no name-search param — that's an honest limitation, not simulated.
 * Mirrors the web app's Students page: page header, KPI stat row (Total/Active/Classes/Showing),
 * and Class + Section pills per row.
 */
export function AdminStudentListView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;

  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const sections = selectedClass?.sections ?? [];

  const listQuery = useGetStudentsListQuery({ schoolClassId: selectedClassId, sectionId: selectedSectionId, page, limit: PAGE_SIZE });
  const students = listQuery.data?.students ?? [];
  const pagination = listQuery.data?.pagination;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;
  const loadingFirstPage = listQuery.isLoading;
  const loadingNextPage = listQuery.isFetching && !loadingFirstPage;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) => s.studentName?.toLowerCase().includes(query));
  }, [students, search]);

  // Loaded-page-only signal, not a full-dataset count — labeled as "Active" among what's fetched
  // so far, same honest scope as "Showing"; "Total Students" and "Classes" below use real
  // full-dataset counts (server pagination total, and the teacher/admin's real class list).
  const activeLoadedCount = useMemo(() => students.filter((s) => s.status?.toLowerCase() === 'active').length, [students]);

  const stats = [
    { key: 'total', label: 'Total Students', icon: 'account-group-outline', color: CLASS_PILL_COLOR, value: pagination?.total ?? students.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#10B981', value: activeLoadedCount },
    { key: 'classes', label: 'Classes', icon: 'book-outline', color: colors.primary, value: classes.length },
    { key: 'showing', label: 'Showing', icon: 'eye-outline', color: '#F59E0B', value: filteredStudents.length },
  ];

  const selectClass = (classId) => {
    setSelectedClassId(classId);
    setSelectedSectionId(null);
    setPage(1);
    setSearch('');
  };

  const selectSection = (sectionId) => {
    setSelectedSectionId(sectionId);
    setPage(1);
    setSearch('');
  };

  const loadMore = () => {
    if (hasMore && !listQuery.isFetching) setPage((p) => p + 1);
  };

  // If already on page 1, changing state to 1 wouldn't trigger a re-fetch, so refetch() explicitly;
  // if deeper in the list, just resetting the page param does it (and avoids re-fetching the old
  // page and duplicating rows via `merge`, since a stale `refetch()` here would use the pre-reset arg).
  const refresh = () => {
    if (page !== 1) setPage(1);
    else listQuery.refetch();
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-group-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Students</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {(user?.academicYear?.name ?? 'Current')} Academic Year · {user?.school?.name ?? 'School'}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        <Chip selected={selectedClassId === null} onPress={() => selectClass(null)}>
          All Classes
        </Chip>
        {classes.map((c) => (
          <Chip key={c._id} selected={c._id === selectedClassId} onPress={() => selectClass(c._id)}>
            {c.name}
          </Chip>
        ))}
      </ScrollView>

      {sections.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          <Chip selected={selectedSectionId === null} onPress={() => selectSection(null)}>
            All Sections
          </Chip>
          {sections.map((s) => (
            <Chip key={s.sectionId._id} selected={s.sectionId._id === selectedSectionId} onPress={() => selectSection(s.sectionId._id)}>
              {s.sectionId.name}
            </Chip>
          ))}
        </ScrollView>
      )}

      <SearchField value={search} onChangeText={setSearch} placeholder="Search loaded students" style={{ marginTop: spacing.sm, marginBottom: spacing.sm }} />

      <QueryState
        isLoading={loadingFirstPage}
        isError={listQuery.isError}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        isEmpty={filteredStudents.length === 0}
        emptyIcon="account-school-outline"
        emptyLabel={search ? `No loaded students match "${search}"` : 'No students found'}
      >
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={<RefreshControl refreshing={page === 1 && listQuery.isFetching && !loadingFirstPage} onRefresh={refresh} />}
          renderItem={({ item }) => (
            <AccentListCard
              accent={studentStatusColor(item.status, colors.border)}
              avatar={<AvatarInitials name={item.studentName} size={40} />}
              title={item.studentName}
              subtitle={item.registrationNumber}
              badge={
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <InlinePill color={CLASS_PILL_COLOR} label={item.className} />
                  <InlinePill color={SECTION_PILL_COLOR} label={item.sectionName} />
                </View>
              }
              onPress={item.studentId ? () => navigation.navigate('StudentDetails', { studentId: item.studentId }) : undefined}
            />
          )}
          ListFooterComponent={
            loadingNextPage ? (
              <View style={{ paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
        {pagination && (
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', paddingBottom: spacing.md }]}>
            Showing {students.length} of {pagination.total}
          </Text>
        )}
      </QueryState>
    </ScreenContainer>
  );
}

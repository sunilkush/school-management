import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetAcademicYearsBySchoolQuery,
  useGetClassDetailsQuery,
  useGetPromotionCandidatesQuery,
  usePromoteStudentsMutation,
} from '../../store/api/apiSlice';

/** Bulk-promotes students from one academic year/class into the next — mirrors
 * frontend's Teachers_&_Students/StudentPromotion.jsx (From → Load Students → To → Promote). */
export function StudentPromotionView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;

  const yearsQuery = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const years = yearsQuery.data ?? [];

  const [fromYearId, setFromYearId] = useState(null);
  const [fromClassId, setFromClassId] = useState(null);
  const [toYearId, setToYearId] = useState(null);
  const [toClassId, setToClassId] = useState(null);
  const [toSectionId, setToSectionId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState('');

  const fromClassesQuery = useGetClassDetailsQuery({ schoolId, academicYearId: fromYearId }, { skip: !schoolId || !fromYearId });
  const fromClasses = fromClassesQuery.data ?? [];

  const toClassesQuery = useGetClassDetailsQuery({ schoolId, academicYearId: toYearId }, { skip: !schoolId || !toYearId });
  const toClasses = toClassesQuery.data ?? [];
  const toSelectedClass = toClasses.find((c) => c._id === toClassId);
  const toSections = toSelectedClass?.sections ?? [];

  const candidatesQuery = useGetPromotionCandidatesQuery(
    { schoolClassId: fromClassId, academicYearId: fromYearId },
    { skip: !fromClassId || !fromYearId }
  );
  const candidates = candidatesQuery.data?.students ?? [];

  const [promoteStudents, { isLoading: isPromoting }] = usePromoteStudentsMutation();

  const toggleStudent = (enrollmentId) => {
    setSelectedIds((prev) => (prev.includes(enrollmentId) ? prev.filter((id) => id !== enrollmentId) : [...prev, enrollmentId]));
  };

  const handlePromote = async () => {
    if (!fromYearId || !toYearId || !toClassId || selectedIds.length === 0) {
      setSnackbar('Pick a From year/class, a To year/class, and at least one student');
      return;
    }
    try {
      const res = await promoteStudents({
        fromAcademicYearId: fromYearId,
        toAcademicYearId: toYearId,
        toSchoolClassId: toClassId,
        toSectionId: toSectionId || undefined,
        enrollmentIds: selectedIds,
      }).unwrap();
      setSnackbar(`Promoted ${res?.promotedCount ?? 0} student(s)${res?.skippedCount ? `, skipped ${res.skippedCount}` : ''}`);
      setSelectedIds([]);
    } catch (err) {
      setSnackbar(err?.data?.message || 'Failed to promote students');
    }
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>From</Text>
      <QueryState isLoading={yearsQuery.isLoading} isError={yearsQuery.isError} error={yearsQuery.error} onRetry={yearsQuery.refetch} isEmpty={years.length === 0} emptyIcon="calendar-range-outline" emptyLabel="No academic years found">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {years.map((y) => (
            <Chip key={y._id} selected={y._id === fromYearId} onPress={() => { setFromYearId(y._id); setFromClassId(null); setSelectedIds([]); }}>
              {y.name}
            </Chip>
          ))}
        </ScrollView>
        {fromYearId && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
            {fromClasses.map((c) => (
              <Chip key={c._id} selected={c._id === fromClassId} onPress={() => { setFromClassId(c._id); setSelectedIds([]); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>
        )}
      </QueryState>

      {fromClassId && (
        <QueryState
          isLoading={candidatesQuery.isLoading}
          isError={candidatesQuery.isError}
          error={candidatesQuery.error}
          onRetry={candidatesQuery.refetch}
          isEmpty={candidates.length === 0}
          emptyIcon="account-group-outline"
          emptyLabel="No students found in this class/year"
        >
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            {selectedIds.length} of {candidates.length} selected
          </Text>
          <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
            {candidates.map((s) => (
              <Pressable
                key={s.enrollmentId}
                onPress={() => toggleStudent(s.enrollmentId)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.sm,
                  borderRadius: 12,
                  backgroundColor: selectedIds.includes(s.enrollmentId) ? colors.surfaceSoft : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <AvatarInitials name={s.name} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text }]}>{s.name}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>{s.registrationNumber}</Text>
                </View>
                {selectedIds.includes(s.enrollmentId) && <Text style={{ color: colors.primary }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </QueryState>
      )}

      <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>To</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
        {years.map((y) => (
          <Chip key={y._id} selected={y._id === toYearId} onPress={() => { setToYearId(y._id); setToClassId(null); setToSectionId(null); }}>
            {y.name}
          </Chip>
        ))}
      </ScrollView>
      {toYearId && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
          {toClasses.map((c) => (
            <Chip key={c._id} selected={c._id === toClassId} onPress={() => { setToClassId(c._id); setToSectionId(null); }}>
              {c.name}
            </Chip>
          ))}
        </ScrollView>
      )}
      {toSections.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {toSections.map((s) => (
            <Chip key={s._id} selected={s._id === toSectionId} onPress={() => setToSectionId(s._id)}>
              {s.name}
            </Chip>
          ))}
        </ScrollView>
      )}

      <Button mode="contained" onPress={handlePromote} loading={isPromoting} disabled={isPromoting} style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
        Promote {selectedIds.length} Student(s)
      </Button>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3500}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}

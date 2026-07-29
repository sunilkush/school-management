import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Snackbar, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetAcademicYearsBySchoolQuery,
  useGetClassDetailsQuery,
  useGetPromotionCandidatesQuery,
  usePromoteStudentsMutation,
} from '../../store/api/apiSlice';

const TO_COLOR = '#0D9488';

function FieldLabel({ children }) {
  const { colors } = useAppTheme();
  return (
    <Text style={{ fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>
      {children}
    </Text>
  );
}

function DirectionLabel({ color, children }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color, textTransform: 'uppercase' }}>{children}</Text>
    </View>
  );
}

function SelectionMark({ selected }) {
  const { colors } = useAppTheme();
  return selected ? (
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="check" size={14} color="#fff" />
    </View>
  ) : (
    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border }} />
  );
}

/** Bulk-promotes students from one academic year/class into the next — mirrors
 * frontend's Teachers_&_Students/StudentPromotion.jsx not just in feature set but in visual
 * structure: page header, a "Promotion Configuration" panel with distinct FROM (blue)/TO (teal)
 * boxes and a direction arrow between them, a stat row, a panel-wrapped student list with its own
 * header, and a persistent bottom action bar with a selection-count badge. */
export function StudentPromotionView() {
  const { colors, typography, spacing, radii } = useAppTheme();
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

  // Web defaults "From" to the active academic year on load (StudentPromotion.jsx) instead of
  // leaving the picker empty.
  useEffect(() => {
    if (!fromYearId && years.length > 0) {
      const active = years.find((y) => y.isActive);
      if (active?._id) setFromYearId(active._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

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

  const selectAll = () => setSelectedIds(candidates.map((s) => s.enrollmentId));
  const clearSelection = () => setSelectedIds([]);

  // Backend requires toSectionId (student.controllers.js's promoteStudentsToNextAcademicYear
  // 400s without it) — the previous check here never verified it client-side, so a user who
  // skipped picking a section got a raw backend error instead of a clear reason.
  const canPromote = selectedIds.length > 0 && !!fromYearId && !!toYearId && !!toClassId && !!toSectionId;

  const missingForPromote = useMemo(() => {
    if (selectedIds.length === 0) return null;
    if (!toYearId || !toClassId || !toSectionId) return 'Fill target year, class and section to enable promotion';
    return null;
  }, [selectedIds.length, toYearId, toClassId, toSectionId]);

  const confirmAndPromote = () => {
    if (!canPromote) return;
    const toClassName = toSelectedClass?.name || 'the selected class';
    const toSectionName = toSections.find((s) => s._id === toSectionId)?.name || '';
    Alert.alert(
      'Promote Students',
      `Promote ${selectedIds.length} student${selectedIds.length !== 1 ? 's' : ''} to ${toClassName}${toSectionName ? ` - ${toSectionName}` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Promote', onPress: handlePromote },
      ]
    );
  };

  const handlePromote = async () => {
    try {
      const res = await promoteStudents({
        fromAcademicYearId: fromYearId,
        toAcademicYearId: toYearId,
        toSchoolClassId: toClassId,
        toSectionId,
        enrollmentIds: selectedIds,
      }).unwrap();
      setSnackbar(`Promoted ${res?.promotedCount ?? 0} student(s)${res?.skippedCount ? `, skipped ${res.skippedCount}` : ''}`);
      setSelectedIds([]);
    } catch (err) {
      setSnackbar(err?.data?.message || err?.message || 'Failed to promote students');
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Page header — mirrors web's PageHeader */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-arrow-up-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Student Promotion</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
            Promote students from one class and academic year to another
          </Text>
        </View>
      </View>

      {/* Promotion Configuration panel */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconWell icon="account-group-outline" color={colors.primary} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>Promotion Configuration</Text>
            <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
              Set source and destination for the promotion
            </Text>
          </View>
        </View>

        {/* FROM box */}
        <View style={{ backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md }}>
          <DirectionLabel color={colors.primary}>From</DirectionLabel>
          <QueryState isLoading={yearsQuery.isLoading} isError={yearsQuery.isError} error={yearsQuery.error} onRetry={yearsQuery.refetch} isEmpty={years.length === 0} emptyIcon="calendar-range-outline" emptyLabel="No academic years found">
            <FieldLabel>Academic Year</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
              {years.map((y) => (
                <Chip key={y._id} selected={y._id === fromYearId} onPress={() => { setFromYearId(y._id); setFromClassId(null); setSelectedIds([]); }}>
                  {y.name}
                </Chip>
              ))}
            </ScrollView>
            {fromYearId && (
              <>
                <FieldLabel>Class</FieldLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
                  {fromClasses.map((c) => (
                    <Chip key={c._id} selected={c._id === fromClassId} onPress={() => { setFromClassId(c._id); setSelectedIds([]); }}>
                      {c.name}
                    </Chip>
                  ))}
                </ScrollView>
              </>
            )}
          </QueryState>
        </View>

        {/* Direction arrow */}
        <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="arrow-down" size={20} color="#fff" />
          </View>
        </View>

        {/* TO box */}
        <View style={{ backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md }}>
          <DirectionLabel color={TO_COLOR}>To</DirectionLabel>
          <FieldLabel>Academic Year</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {years.filter((y) => y._id !== fromYearId).map((y) => (
              <Chip key={y._id} selected={y._id === toYearId} onPress={() => { setToYearId(y._id); setToClassId(null); setToSectionId(null); }}>
                {y.name}
              </Chip>
            ))}
          </ScrollView>
          {toYearId && (
            <>
              <FieldLabel>Class</FieldLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {toClasses.map((c) => (
                  <Chip key={c._id} selected={c._id === toClassId} onPress={() => { setToClassId(c._id); setToSectionId(null); }}>
                    {c.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}
          {toClassId && (
            <QueryState isLoading={false} isError={false} isEmpty={toSections.length === 0} emptyIcon="google-classroom" emptyLabel="No sections in this class">
              <FieldLabel>Section</FieldLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
                {toSections.map((s) => (
                  <Chip key={s._id} selected={s._id === toSectionId} onPress={() => setToSectionId(s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </QueryState>
          )}
        </View>
      </Panel>

      {/* Stat row — only once a source class has real candidate data */}
      {fromClassId && candidates.length > 0 && (
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Total Students" metric={{ value: candidates.length, icon: 'account-group-outline', color: colors.primary }} />
            <StatCard label="Selected" metric={{ value: selectedIds.length, icon: 'check-circle-outline', color: colors.success }} />
            <StatCard label="Not Selected" metric={{ value: candidates.length - selectedIds.length, icon: 'account-outline', color: colors.warning }} />
          </StatGrid>
        </View>
      )}

      {/* Student List panel */}
      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Student List</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {selectedIds.length > 0 ? `${selectedIds.length} of ${candidates.length} selected` : `${candidates.length} student${candidates.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {!fromClassId ? (
          <View style={{ alignItems: 'center', padding: spacing.xl }}>
            <IconWell icon="school-outline" color={colors.primary} size={56} />
            <Text style={[typography.bodyStrong, { color: colors.text, marginTop: spacing.md }]}>No students loaded</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4, textAlign: 'center' }]}>
              Select a source year and class above
            </Text>
          </View>
        ) : (
          <QueryState
            isLoading={candidatesQuery.isLoading}
            isError={candidatesQuery.isError}
            error={candidatesQuery.error}
            onRetry={candidatesQuery.refetch}
            isEmpty={candidates.length === 0}
            emptyIcon="account-group-outline"
            emptyLabel="No students found in this class/year"
          >
            <View style={{ padding: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Button compact mode="text" onPress={selectAll} disabled={selectedIds.length === candidates.length}>
                  Select All
                </Button>
                <Button compact mode="text" onPress={clearSelection} disabled={selectedIds.length === 0}>
                  Clear
                </Button>
              </View>
              {candidates.map((s) => {
                const selected = selectedIds.includes(s.enrollmentId);
                return (
                  <AccentListCard
                    key={s.enrollmentId}
                    accent={selected ? colors.primary : colors.border}
                    avatar={<AvatarInitials name={s.name} size={36} />}
                    title={s.name}
                    subtitle={s.registrationNumber}
                    badge={<SelectionMark selected={selected} />}
                    onPress={() => toggleStudent(s.enrollmentId)}
                    meta={[
                      { label: 'Email', value: s.email || '—' },
                      { label: 'Current Class', value: s.currentClass || '—' },
                      { label: 'Current Section', value: s.currentSection || '—' },
                    ]}
                  />
                );
              })}
            </View>
          </QueryState>
        )}
      </Panel>

      {/* Bottom action bar — mirrors web's persistent selection-status + actions panel */}
      <Panel style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 }}>
          <View
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: selectedIds.length > 0 ? colors.primary : colors.surfaceSoft,
              borderWidth: 2, borderColor: selectedIds.length > 0 ? colors.primary : colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '800', color: selectedIds.length > 0 ? '#fff' : colors.textMuted }}>
              {selectedIds.length}
            </Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {selectedIds.length === 0 ? 'No students selected' : `${selectedIds.length} student${selectedIds.length !== 1 ? 's' : ''} selected`}
            </Text>
            {selectedIds.length > 0 && !missingForPromote && (
              <Text style={[typography.caption, { color: colors.success }]}>Ready to promote</Text>
            )}
            {missingForPromote && (
              <Text style={[typography.caption, { color: colors.warning }]}>{missingForPromote}</Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {selectedIds.length > 0 && (
            <Button mode="outlined" compact onPress={clearSelection}>
              Clear
            </Button>
          )}
          <Button
            mode="contained"
            compact
            icon="check"
            buttonColor={canPromote ? colors.success : undefined}
            onPress={confirmAndPromote}
            loading={isPromoting}
            disabled={!canPromote || isPromoting}
          >
            {isPromoting ? 'Promoting…' : `Promote${selectedIds.length > 0 ? ` ${selectedIds.length}` : ''}`}
          </Button>
        </View>
      </Panel>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3500}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}

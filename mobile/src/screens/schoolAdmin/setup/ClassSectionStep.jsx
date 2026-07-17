import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryState } from '../../../components/ui/QueryState';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import {
  useGetSchoolBoardsQuery,
  useGetBoardClassesQuery,
  useGetSchoolClassesQuery,
  useGetSectionsQuery,
  useCreateSchoolClassMutation,
  useDeleteSchoolClassMutation,
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useGetActiveAcademicYearQuery,
} from '../../../store/api/apiSlice';

/**
 * Mirrors web's SchoolClass.jsx: toggle a board-class template "on" to create the real
 * SchoolClass, then add/remove comma-separated sections under it. The nested `schoolClasses[].
 * sections` shape only carries {_id,name,teacher,subjects} — not enough to know if a section has
 * enrolled students — so a section's delete-safety is checked against the full Section docs from
 * getSections (post-fix) instead, same split web makes between fetchSchoolClasses and fetchSections.
 */
export function ClassSectionStep() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const schoolBoardsQuery = useGetSchoolBoardsQuery(schoolId, { skip: !schoolId });
  const boardId = schoolBoardsQuery.data?.[0]?.boardId?._id || schoolBoardsQuery.data?.[0]?.boardId;

  const boardClassQuery = useGetBoardClassesQuery(boardId, { skip: !boardId });
  const boardClasses = boardClassQuery.data ?? [];

  const schoolClassesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const schoolClasses = schoolClassesQuery.data ?? [];

  const sectionsQuery = useGetSectionsQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const fullSections = sectionsQuery.data ?? [];
  const enrollmentCount = (sectionId) => {
    const full = fullSections.find((s) => s._id === sectionId);
    return full?.studentEnrollmentIds?.length || 0;
  };

  const [createSchoolClass, createClassState] = useCreateSchoolClassMutation();
  const [deleteSchoolClass, deleteClassState] = useDeleteSchoolClassMutation();
  const [createSection, createSectionState] = useCreateSectionMutation();
  const [deleteSection] = useDeleteSectionMutation();
  const [sectionInputs, setSectionInputs] = useState({});

  const getAssignedClass = (record) => schoolClasses.find((c) => c.name === record.classId?.name);

  const handleToggleAssign = (record) => {
    const cls = getAssignedClass(record);
    if (cls) return; // already assigned — no unassign toggle here, use the per-row Remove Class action instead
    createSchoolClass({
      schoolId,
      academicYearId,
      classId: record.classId?._id,
      name: record.classId?.name,
      boardClassId: record._id,
    });
  };

  const handleDeleteClass = (record) => {
    const cls = getAssignedClass(record);
    if (!cls || (cls.sections ?? []).length > 0) return;
    deleteSchoolClass(cls._id);
  };

  const handleAddSections = (record) => {
    const cls = getAssignedClass(record);
    const input = sectionInputs[record._id];
    if (!cls || !input?.trim()) return;
    const names = input.split(',').map((s) => s.trim()).filter(Boolean);
    names.forEach((name) => createSection({ schoolId, schoolClassId: cls._id, name, capacity: 100, academicYearId }));
    setSectionInputs((p) => ({ ...p, [record._id]: '' }));
  };

  if (!academicYearId) {
    return (
      <View style={{ padding: spacing.xl, alignItems: 'center' }}>
        <MaterialCommunityIcons name="calendar-alert" size={40} color={colors.textMuted} />
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
          Set an active academic year first (Academic Year step).
        </Text>
      </View>
    );
  }

  return (
    <QueryState
      isLoading={boardClassQuery.isLoading || schoolClassesQuery.isLoading}
      isError={boardClassQuery.isError}
      error={boardClassQuery.error}
      onRetry={boardClassQuery.refetch}
      isEmpty={!boardId}
      emptyIcon="apps"
      emptyLabel="Assign a board first (Boards step)"
    >
      <QueryState isLoading={false} isEmpty={boardClasses.length === 0} emptyIcon="view-grid-outline" emptyLabel="No class templates found for this board">
        {boardClasses.map((record) => {
          const cls = getAssignedClass(record);
          const assigned = !!cls;
          const sections = cls?.sections ?? [];

          return (
            <View
              key={record._id}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 3,
                borderLeftColor: assigned ? colors.primary : colors.border,
                borderRadius: radii.lg,
                marginBottom: spacing.sm,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
                <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {record.classId?.name || 'Unnamed Class'}
                </Text>
                {assigned ? (
                  <Button compact mode="outlined" textColor={colors.danger} disabled={sections.length > 0 || deleteClassState.isLoading} onPress={() => handleDeleteClass(record)}>
                    Remove
                  </Button>
                ) : (
                  <Button compact mode="contained" loading={createClassState.isLoading} disabled={createClassState.isLoading} onPress={() => handleToggleAssign(record)}>
                    Assign
                  </Button>
                )}
              </View>

              {assigned && (
                <View style={{ padding: spacing.md, paddingTop: 0 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm }}>
                    {sections.length === 0 ? (
                      <Text style={[typography.caption, { color: colors.textMuted }]}>No sections yet</Text>
                    ) : (
                      sections.map((sec) => {
                        const count = enrollmentCount(sec._id);
                        return (
                          <Chip
                            key={sec._id}
                            compact
                            onClose={count > 0 ? undefined : () => deleteSection(sec._id)}
                            disabled={count > 0}
                          >
                            {sec.name}{count > 0 ? ` (${count})` : ''}
                          </Chip>
                        );
                      })
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TextInput
                      mode="outlined"
                      dense
                      placeholder="A, B, C"
                      value={sectionInputs[record._id] || ''}
                      onChangeText={(v) => setSectionInputs((p) => ({ ...p, [record._id]: v }))}
                      style={{ flex: 1 }}
                    />
                    <Button compact mode="contained" loading={createSectionState.isLoading} disabled={createSectionState.isLoading} onPress={() => handleAddSections(record)}>
                      Add
                    </Button>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </QueryState>
    </QueryState>
  );
}

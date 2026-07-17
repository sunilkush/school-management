import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { QueryState } from '../../../components/ui/QueryState';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useGetSchoolClassesQuery, useGetSubjectsQuery, useAddSubjectToSectionMutation, useGetActiveAcademicYearQuery } from '../../../store/api/apiSlice';

/** One row per section (grouped visually under a class-name caption), a chip-toggle multi-select
 * of subjects (matches this app's established chip-toggle pattern rather than a native dropdown
 * multiselect), Save replaces that section's subjects array wholesale — matches backend behavior. */
export function SubjectMappingStep() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const classesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const schoolClasses = classesQuery.data ?? [];
  const subjectsQuery = useGetSubjectsQuery();
  const subjects = subjectsQuery.data ?? [];

  const [mapping, setMapping] = useState({});
  const [addSubjectToSection, saveState] = useAddSubjectToSectionMutation();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const init = {};
    schoolClasses.forEach((cls) => {
      (cls.sections ?? []).forEach((sec) => {
        init[sec._id] = (sec.subjects ?? []).map((s) => s._id || s);
      });
    });
    setMapping(init);
  }, [classesQuery.data]);

  const toggleSubject = (sectionId, subjectId) => {
    setMapping((p) => {
      const current = p[sectionId] || [];
      const next = current.includes(subjectId) ? current.filter((id) => id !== subjectId) : [...current, subjectId];
      return { ...p, [sectionId]: next };
    });
  };

  const handleSave = async (schoolClassId, sectionId) => {
    setSavingId(sectionId);
    try {
      await addSubjectToSection({ schoolClassId, sectionId, subjectIds: mapping[sectionId] || [] }).unwrap();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <QueryState
      isLoading={classesQuery.isLoading || subjectsQuery.isLoading}
      isError={classesQuery.isError}
      error={classesQuery.error}
      onRetry={classesQuery.refetch}
      isEmpty={schoolClasses.length === 0}
      emptyIcon="book-open-variant"
      emptyLabel="No classes set up yet (Classes step)"
    >
      {schoolClasses.map((cls) => (
        <View key={cls._id} style={{ marginBottom: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
            {cls.name.toUpperCase()}
          </Text>
          {(cls.sections ?? []).length === 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>No sections yet</Text>
          ) : (
            cls.sections.map((sec) => {
              const selected = mapping[sec._id] || [];
              return (
                <View
                  key={sec._id}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderLeftWidth: 3,
                    borderLeftColor: selected.length > 0 ? colors.success : '#F59E0B',
                    borderRadius: 14,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>Section {sec.name}</Text>
                  <Text style={[typography.caption, { color: selected.length > 0 ? colors.success : '#F59E0B', marginBottom: spacing.sm }]}>
                    {selected.length > 0 ? `${selected.length} subject${selected.length !== 1 ? 's' : ''} assigned` : 'No subjects assigned'}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ gap: spacing.xs, marginBottom: spacing.sm, alignItems: 'center' }}
                  >
                    {subjects.map((subj) => (
                      <Chip key={subj._id} compact selected={selected.includes(subj._id)} onPress={() => toggleSubject(sec._id, subj._id)}>
                        {subj.name}
                      </Chip>
                    ))}
                  </ScrollView>
                  <Button
                    compact
                    mode="contained"
                    style={{ alignSelf: 'flex-start' }}
                    loading={saveState.isLoading && savingId === sec._id}
                    disabled={saveState.isLoading}
                    onPress={() => handleSave(cls._id, sec._id)}
                  >
                    Save
                  </Button>
                </View>
              );
            })
          )}
        </View>
      ))}
    </QueryState>
  );
}

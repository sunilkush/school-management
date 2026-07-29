import React from 'react';
import { Linking, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyEnrollmentQuery, useGetStudyMaterialsQuery } from '../../store/api/apiSlice';

const TYPE_ICON = {
  notes: 'note-text-outline', book: 'book-outline', video: 'video-outline',
  assignment: 'clipboard-text-outline', question_paper: 'file-question-outline', other: 'file-outline',
};

/** Read-only browse of study materials for the student's own class — mirrors
 * frontend/src/pages/Student/StudyMaterials/StudyMaterials.jsx. Reuses the same GET
 * /study-materials endpoint Teacher's create-flow screen uses (Student is allowed to call it
 * too), just without the "New Material" button. */
export function StudyMaterialsBrowseView() {
  const { colors, typography, spacing } = useAppTheme();
  const enrollmentQuery = useGetMyEnrollmentQuery();
  const enrollment = enrollmentQuery.data;

  const { data, isLoading, isFetching, isError, error, refetch } = useGetStudyMaterialsQuery(
    { academicYearId: enrollment?.academicYear?._id, schoolClassId: enrollment?.schoolClass?._id },
    { skip: !enrollment?.schoolClass?._id }
  );
  const materials = data?.items ?? [];

  const openLink = (item) => {
    const url = item.externalLink || item.fileUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="folder-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Study Materials</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Notes, books and resources for your class
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={enrollmentQuery.isLoading || isLoading || isFetching}
        isError={enrollmentQuery.isError || isError}
        error={enrollmentQuery.error || error}
        onRetry={enrollmentQuery.isError ? enrollmentQuery.refetch : refetch}
        isEmpty={materials.length === 0}
        emptyIcon="folder-outline"
        emptyLabel="No study materials available yet"
      >
        {materials.map((item) => (
          <AccentListCard
            key={item._id}
            accent={colors.accent}
            avatar={<IconWell icon={TYPE_ICON[item.type] || 'file-outline'} color={colors.accent} size={40} />}
            title={item.title}
            subtitle={item.subjectId?.name ?? ''}
            badge={<StatusPill label={item.type.replace('_', ' ')} color={colors.accent} />}
            meta={[...(item.description ? [{ label: 'Description', value: item.description }] : [])]}
            actions={(item.externalLink || item.fileUrl) ? (
              <Button size="small" mode="text" icon="open-in-new" onPress={() => openLink(item)}>
                Open
              </Button>
            ) : undefined}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

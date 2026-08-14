import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateStudyMaterialSheet } from './CreateStudyMaterialSheet';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetAssignedClassesQuery, useGetStudyMaterialsQuery } from '../../store/api/apiSlice';

const TYPE_ICON = {
  notes: 'note-text-outline', book: 'book-outline', video: 'video-outline',
  assignment: 'clipboard-text-outline', question_paper: 'file-question-outline', other: 'file-outline',
};

export function StudyMaterialsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [creating, setCreating] = useState(false);

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];

  // Backend default limit=20 with no override would silently truncate a full year of uploads.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetStudyMaterialsQuery({ academicYearId, limit: 500 }, { skip: !academicYearId });
  const materials = data?.items ?? [];

  const openLink = (item) => {
    const url = item.externalLink || item.fileUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Material
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={materials.length === 0}
        emptyIcon="folder-outline"
        emptyLabel="No study materials yet"
      >
        {materials.map((item) => (
          <AccentListCard
            key={item._id}
            accent={colors.accent}
            avatar={<IconWell icon={TYPE_ICON[item.type] || 'file-outline'} color={colors.accent} size={40} />}
            title={item.title}
            subtitle={`${item.schoolClassId?.name ?? ''}${item.sectionId?.name ? ` · ${item.sectionId.name}` : ''} · ${item.subjectId?.name ?? ''}`}
            badge={<StatusPill label={item.type.replace('_', ' ')} color={colors.accent} />}
            meta={[
              ...(item.description ? [{ label: 'Description', value: item.description }] : []),
              { label: 'Uploaded By', value: item.uploadedBy?.name ?? '—' },
            ]}
            actions={(item.externalLink || item.fileUrl) ? (
              <Button size="small" mode="text" icon="open-in-new" onPress={() => openLink(item)}>
                Open
              </Button>
            ) : undefined}
            expandable
          />
        ))}
      </QueryState>

      <CreateStudyMaterialSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}

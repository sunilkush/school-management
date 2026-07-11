import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { pillStyle } from '../../theme/patterns';
import { CreateHomeworkSheet } from './CreateHomeworkSheet';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAssignedClassesQuery, useGetTeacherHomeworkQuery } from '../../store/api/apiSlice';

export function TeacherHomeworkView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [creating, setCreating] = useState(false);

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTeacherHomeworkQuery(academicYearId, { skip: !academicYearId });
  const homework = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Homework
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={homework.length === 0}
        emptyIcon="clipboard-text-outline"
        emptyLabel="No homework assigned yet"
      >
        {homework.map((item) => (
          <AccentListCard
            key={item._id}
            accent={colors.primary}
            avatar={<IconWell icon="clipboard-text-outline" color={colors.primary} size={40} />}
            title={item.title}
            subtitle={`${item.schoolClassId?.name ?? ''}${item.sectionId?.name ? ` · ${item.sectionId.name}` : ''} · Due ${formatDate(item.dueDate)}`}
            badge={
              <View style={pillStyle(colors.primary)}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 10.5 }]}>
                  {item.submissionCount} submitted
                </Text>
              </View>
            }
            onPress={() => navigation.navigate('HomeworkSubmissions', { assignmentId: item._id, title: item.title })}
          />
        ))}
      </QueryState>

      <CreateHomeworkSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}

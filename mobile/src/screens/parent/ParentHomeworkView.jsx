import React, { useState } from 'react';
import { View } from 'react-native';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { HOMEWORK_STATUS_META, homeworkStatus } from '../../utils/homework';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetChildHomeworkQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

/** Parent's read-only view of a child's homework — no Submit action here (no submit route exists
 * for Parent), otherwise the same card layout as Student's own StudentHomeworkView. */
export function ParentHomeworkView() {
  const { spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const homeworkQuery = useGetChildHomeworkQuery(activeChild?.userId, { skip: !activeChild?.userId });
  const homework = homeworkQuery.data?.homework ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      isEmpty={children.length === 0}
      emptyIcon="account-child-outline"
      emptyLabel="No children linked to your account yet"
    >
      <View style={{ marginBottom: spacing.md }}>
        <ChildPicker children={children} selectedId={activeChild?._id} onSelect={setSelectedChild} />
      </View>

      <QueryState
        isLoading={homeworkQuery.isLoading || homeworkQuery.isFetching}
        isError={homeworkQuery.isError}
        error={homeworkQuery.error}
        onRetry={homeworkQuery.refetch}
        isEmpty={homework.length === 0}
        emptyIcon="clipboard-text-outline"
        emptyLabel="No homework assigned to this child yet"
      >
        {homework.map((item) => {
          const status = homeworkStatus(item);
          const meta = HOMEWORK_STATUS_META[status];
          return (
            <AccentListCard
              key={item._id}
              accent={meta.color}
              avatar={<IconWell icon={meta.icon} color={meta.color} size={40} />}
              title={item.title}
              subtitle={`${item.subjectId?.name ?? 'Subject'} · Due ${formatDate(item.dueDate)}`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              meta={[
                { label: 'Description', value: item.description },
                ...(item.submission?.grade != null ? [{ label: 'Grade', value: item.submission.grade }] : []),
                ...(item.submission?.feedback ? [{ label: 'Feedback', value: item.submission.feedback }] : []),
              ]}
              expandable
            />
          );
        })}
      </QueryState>
    </QueryState>
  );
}

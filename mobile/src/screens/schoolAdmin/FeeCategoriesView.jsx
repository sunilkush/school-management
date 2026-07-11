import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateFeeHeadSheet } from './CreateFeeHeadSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetFeeHeadsBySchoolQuery } from '../../store/api/apiSlice';

const TYPE_COLOR = { recurring: '#2563EB', 'one-time': '#22C55E', penalty: '#EF4444' };

export function FeeCategoriesView() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetFeeHeadsBySchoolQuery();
  const feeHeads = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Category
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={feeHeads.length === 0}
        emptyIcon="tag-outline"
        emptyLabel="No fee categories yet"
      >
        {feeHeads.map((fh) => (
          <AccentListCard
            key={fh._id}
            accent={TYPE_COLOR[fh.type] || colors.primary}
            avatar={<IconWell icon="tag-outline" color={TYPE_COLOR[fh.type] || colors.primary} size={40} />}
            title={fh.name}
            badge={<StatusPill label={fh.type} color={TYPE_COLOR[fh.type] || colors.textMuted} />}
            meta={[{ label: 'Status', value: fh.status }]}
          />
        ))}
      </QueryState>

      <CreateFeeHeadSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

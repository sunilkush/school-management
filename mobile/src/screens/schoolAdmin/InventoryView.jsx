import React, { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateInventoryItemSheet } from './CreateInventoryItemSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetInventoryItemsQuery } from '../../store/api/apiSlice';

export function InventoryView() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetInventoryItemsQuery();
  const items = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Item
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={items.length === 0}
        emptyIcon="archive-outline"
        emptyLabel="No inventory items yet"
      >
        {items.map((item) => (
          <AccentListCard
            key={item._id}
            accent={item.lowStock ? colors.danger : colors.primary}
            avatar={<IconWell icon={item.itemType === 'asset' ? 'desktop-classic' : 'package-variant-closed'} color={item.lowStock ? colors.danger : colors.primary} size={40} />}
            title={item.name}
            subtitle={`${item.category} · ${item.quantity} ${item.unit}`}
            badge={item.lowStock ? <StatusPill label="Low Stock" color={colors.danger} /> : null}
            meta={[
              { label: 'Available', value: item.available },
              { label: 'Allocated', value: item.allocated },
              { label: 'Location', value: item.location || '—' },
            ]}
            expandable
          />
        ))}
      </QueryState>

      <CreateInventoryItemSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

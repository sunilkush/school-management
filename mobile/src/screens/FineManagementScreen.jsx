import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useCollectFineMutation, useGetFineSummaryQuery } from '../store/api/apiSlice';

const STATUS_COLOR = { Pending: '#F59E0B', Paid: '#22C55E', Waived: '#94A3B8' };
const STATUS_OPTIONS = [null, 'Pending', 'Paid', 'Waived'];

/** Collect or waive overdue book fines — distinct from IssuedBooksScreen's return flow, which
 * only auto-computes and displays a fine, never collects it. Mirrors
 * frontend/src/pages/Librarian/FineManagement.jsx. */
export function FineManagementScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [statusFilter, setStatusFilter] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetFineSummaryQuery();
  const records = (data?.records ?? []).filter((r) => !statusFilter || r.fineStatus === statusFilter);
  const summary = data?.summary ?? {};
  const [collectFine, collectState] = useCollectFineMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cash-remove" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Fine Management</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Pending" metric={{ label: 'Pending', icon: 'clock-outline', color: '#F59E0B', value: summary.totalPending ?? 0, format: 'currency' }} />
          <StatCard label="Collected" metric={{ label: 'Collected', icon: 'cash-check', color: '#22C55E', value: summary.totalCollected ?? 0, format: 'currency' }} />
          <StatCard label="Waived" metric={{ label: 'Waived', icon: 'cash-remove', color: '#94A3B8', value: summary.totalWaived ?? 0, format: 'currency' }} />
        </StatGrid>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s || 'all'} selected={statusFilter === s} onPress={() => setStatusFilter(s)}>
            {s ?? 'All'}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon="cash-remove"
        emptyLabel="No fines to show"
      >
        {records.map((r) => (
          <AccentListCard
            key={r._id}
            accent={STATUS_COLOR[r.fineStatus] || colors.textMuted}
            avatar={<AvatarInitials name={r.borrowerName} size={40} />}
            title={r.bookId?.title ?? 'Book'}
            subtitle={r.borrowerName}
            badge={<StatusPill label={r.fineStatus} color={STATUS_COLOR[r.fineStatus] || colors.textMuted} />}
            meta={[
              { label: 'Fine', value: formatCurrency(r.fine ?? 0) },
              { label: 'Due Date', value: formatDate(r.dueDate) },
              ...(r.fineNote ? [{ label: 'Note', value: r.fineNote }] : []),
            ]}
            expandable
            actions={
              r.fineStatus === 'Pending' ? (
                <>
                  <Button
                    size="small"
                    mode="contained"
                    onPress={() => collectFine({ id: r._id, action: 'paid' })}
                    loading={collectState.isLoading}
                    disabled={collectState.isLoading}
                  >
                    Mark Paid
                  </Button>
                  <Button
                    size="small"
                    mode="outlined"
                    onPress={() => collectFine({ id: r._id, action: 'waived' })}
                    disabled={collectState.isLoading}
                  >
                    Waive
                  </Button>
                </>
              ) : null
            }
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

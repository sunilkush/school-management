import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { LedgerRecordSheet } from './LedgerRecordSheet';
import { paymentModeLabel } from '../../utils/finance';
import { formatCurrency, formatDate } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Shared list/create/delete view for Income and Expense ledgers — identical shape on the web app
 * (frontend/src/pages/Accountant/Finance/IncomeManagement.jsx and ExpenseManagement.jsx). Editing
 * an existing record is deferred (create + delete covers the core data-entry workflow; edit would
 * reuse the same form but isn't wired up here). */
export function FinanceLedgerView({
  title,
  subtitle,
  icon,
  accentColor,
  categories,
  extraFieldLabel,
  extraFieldKey,
  statusMeta,
  useRecordsQuery,
  useCreateMutation,
  useDeleteMutation,
}) {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [creating, setCreating] = useState(false);

  // No "load more"/infinite-scroll here, so limit=50 (the backend's own default) would silently
  // hide older records for any school with a full year of entries — raised so search/category
  // filters are the only narrowing a user needs.
  const { data, isLoading, isFetching, isError, error, refetch } = useRecordsQuery({
    category: selectedCategory || undefined,
    search: search.trim() || undefined,
    limit: 500,
  });
  const [deleteRecord, deleteState] = useDeleteMutation();

  const records = data?.records ?? [];

  const stats = [
    { key: 'total', label: 'Total Amount', icon, color: accentColor, format: 'currency', value: data?.totalAmount ?? 0 },
    { key: 'count', label: 'Records', icon: 'counter', color: '#14B8A6', value: data?.count ?? 0 },
  ];

  const filteredCategories = useMemo(() => {
    const inUse = new Set(records.map((r) => r.category));
    return categories.filter((c) => inUse.has(c) || c === selectedCategory);
  }, [records, categories, selectedCategory]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon={icon} color={accentColor} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          Add Record
        </Button>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
        <Chip selected={!selectedCategory} onPress={() => setSelectedCategory(null)}>
          All Categories
        </Chip>
        {filteredCategories.map((c) => (
          <Chip key={c} selected={c === selectedCategory} onPress={() => setSelectedCategory(c)}>
            {c}
          </Chip>
        ))}
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by title" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={records.length === 0}
        emptyIcon={icon}
        emptyLabel={search || selectedCategory ? 'No records match your filters' : 'No records yet'}
      >
        {records.map((r) => {
          const statusInfo = statusMeta?.[r.status];
          return (
            <AccentListCard
              key={r._id}
              accent={statusInfo?.color ?? accentColor}
              avatar={<IconWell icon={icon} color={accentColor} size={38} />}
              title={r.title}
              subtitle={`${r.category} · ${formatDate(r.date)}`}
              badge={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {statusInfo && <StatusPill label={statusInfo.label} color={statusInfo.color} />}
                  <Text style={[typography.bodyStrong, { color: accentColor }]}>{formatCurrency(r.amount)}</Text>
                </View>
              }
              meta={[
                { label: 'Payment Mode', value: paymentModeLabel(r.paymentMode) },
                { label: extraFieldLabel, value: r[extraFieldKey] },
                { label: 'Reference', value: r.referenceNo },
                { label: 'Description', value: r.description },
              ]}
              expandable
              actions={
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteRecord(r._id), 'this record')}
                />
              }
            />
          );
        })}
      </QueryState>

      <LedgerRecordSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        categories={categories}
        extraFieldLabel={extraFieldLabel}
        extraFieldKey={extraFieldKey}
        useCreateMutation={useCreateMutation}
      />
    </ScreenContainer>
  );
}

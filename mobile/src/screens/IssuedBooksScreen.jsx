import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { IssueBookSheet } from './library/IssueBookSheet';
import { ReturnBookSheet } from './library/ReturnBookSheet';
import { ISSUED_BOOK_STATUS_META } from '../utils/library';
import { formatCurrency, formatDate } from '../utils/format';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteIssuedBookMutation, useGetIssuedBooksQuery } from '../store/api/apiSlice';

/** Mirrors frontend/src/pages/School_Admin/Library/IssueBook.jsx. Issuing to staff and manual
 * fine-collection (patch /:id/fine) are deferred — issue/return to a Student covers the core
 * workflow (a return with an overdue fine is still computed and shown automatically). */
export function IssuedBooksScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [statusFilter, setStatusFilter] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [returning, setReturning] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetIssuedBooksQuery();
  const [deleteIssuedBook, deleteState] = useDeleteIssuedBookMutation();
  const records = data ?? [];

  const filtered = useMemo(() => (statusFilter ? records.filter((r) => r.status === statusFilter) : records), [records, statusFilter]);

  const stats = [
    { key: 'issued', label: 'Currently Issued', icon: 'book-arrow-right-outline', color: colors.primary, value: records.filter((r) => r.status === 'Issued').length },
    { key: 'overdue', label: 'Overdue', icon: 'alert-outline', color: '#EF4444', value: records.filter((r) => r.status === 'Overdue').length },
    { key: 'returned', label: 'Returned', icon: 'book-check-outline', color: '#22C55E', value: records.filter((r) => r.status === 'Returned').length },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="book-arrow-right-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Issued Books</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Issue, return and track library books
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setIssuing(true)}>
          Issue Book
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
        <Chip selected={!statusFilter} onPress={() => setStatusFilter(null)}>
          All
        </Chip>
        {Object.keys(ISSUED_BOOK_STATUS_META).map((s) => (
          <Chip key={s} selected={s === statusFilter} onPress={() => setStatusFilter(s)}>
            {s}
          </Chip>
        ))}
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="book-off-outline"
        emptyLabel={statusFilter ? 'No records match this status' : 'No books issued yet'}
      >
        {filtered.map((r) => {
          const meta = ISSUED_BOOK_STATUS_META[r.status] ?? ISSUED_BOOK_STATUS_META.Issued;
          const active = r.status === 'Issued' || r.status === 'Overdue';
          return (
            <AccentListCard
              key={r._id}
              accent={meta.color}
              avatar={<AvatarInitials name={r.borrowerName} size={40} />}
              title={r.bookId?.title ?? 'Book'}
              subtitle={`${r.borrowerName} · Due ${formatDate(r.dueDate)}`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              meta={[
                { label: 'Issued On', value: formatDate(r.issueDate) },
                { label: 'Fine', value: r.fine > 0 ? `${formatCurrency(r.fine)} (${r.fineStatus})` : 'None' },
              ]}
              expandable
              actions={
                <>
                  {active && (
                    <Button mode="contained" compact onPress={() => setReturning(r)}>
                      Return
                    </Button>
                  )}
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={deleteState.isLoading}
                    onPress={() => deleteIssuedBook(r._id)}
                  />
                </>
              }
            />
          );
        })}
      </QueryState>

      <IssueBookSheet visible={issuing} onDismiss={() => setIssuing(false)} onIssued={() => setIssuing(false)} />
      <ReturnBookSheet issuedBook={returning} onDismiss={() => setReturning(null)} onReturned={() => setReturning(null)} />
    </ScreenContainer>
  );
}

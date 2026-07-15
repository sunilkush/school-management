import React, { useState } from 'react';
import { View } from 'react-native';
import { ChildPicker } from '../../components/ui/ChildPicker';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetChildLibraryBooksQuery, useGetMyChildrenQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Issued: '#2563EB', Overdue: '#EF4444', Returned: '#22C55E', Lost: '#94A3B8' };

/** Parent's view of a child's library history — unlike Student's own LibraryView (currently-
 * borrowed only), this endpoint returns the child's FULL issue history (no status filter
 * server-side), so "empty" here really means no books ever issued, not none currently borrowed. */
export function ParentLibraryView() {
  const { colors, spacing } = useAppTheme();
  const [selectedChild, setSelectedChild] = useState(null);
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];
  const activeChild = selectedChild ?? children[0] ?? null;

  const booksQuery = useGetChildLibraryBooksQuery(activeChild?.userId, { skip: !activeChild?.userId });
  const books = booksQuery.data ?? [];

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
        isLoading={booksQuery.isLoading || booksQuery.isFetching}
        isError={booksQuery.isError}
        error={booksQuery.error}
        onRetry={booksQuery.refetch}
        isEmpty={books.length === 0}
        emptyIcon="book-outline"
        emptyLabel="No library history for this child yet"
      >
        {books.map((item) => (
          <AccentListCard
            key={item._id}
            accent={STATUS_COLOR[item.status] || colors.primary}
            avatar={<IconWell icon="book-outline" color={STATUS_COLOR[item.status] || colors.primary} size={40} />}
            title={item.bookId?.title ?? 'Unknown Book'}
            subtitle={item.bookId?.author ?? ''}
            badge={<StatusPill label={item.status} color={STATUS_COLOR[item.status] || colors.textMuted} />}
            meta={[
              { label: 'Issued', value: formatDate(item.issueDate) },
              { label: 'Due', value: formatDate(item.dueDate) },
              ...(item.status === 'Overdue' ? [{ label: 'Fine', value: formatCurrency(item.fineAmount ?? 0) }] : []),
            ]}
            expandable
          />
        ))}
      </QueryState>
    </QueryState>
  );
}

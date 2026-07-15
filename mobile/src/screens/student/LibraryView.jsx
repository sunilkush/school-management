import React from 'react';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyLibraryBooksQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Issued: '#2563EB', Overdue: '#EF4444', Returned: '#22C55E', Lost: '#94A3B8' };

/** Student's own currently-borrowed books — mirrors frontend/src/pages/Student/Library/StudentAllowedBook.jsx. */
export function LibraryView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyLibraryBooksQuery();
  const books = data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={books.length === 0}
        emptyIcon="book-outline"
        emptyLabel="You have no books currently borrowed"
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
    </ScreenContainer>
  );
}

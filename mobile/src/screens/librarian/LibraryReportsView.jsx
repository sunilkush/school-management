import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Panel } from '../../components/ui/Panel';
import { IconWell } from '../../components/ui/IconWell';
import { VerticalBarChart } from '../../components/charts/VerticalBarChart';
import { formatCurrency } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetBooksQuery, useGetIssuedBooksQuery } from '../../store/api/apiSlice';

const CATEGORY_COLORS = ['#14B8A6', '#0891B2', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'];

/** Mirrors web's LibraryReports.jsx — entirely client-computed from the same 2 endpoints Books/
 * IssuedBooks screens already call (no dedicated reports endpoint on web either). Print/CSV export
 * not ported — no native file/share dependency in this app yet, same category of gap as
 * AdmitCardView's PDF download. */
export function LibraryReportsView() {
  const { colors, typography, spacing } = useAppTheme();
  const booksQuery = useGetBooksQuery();
  const issuedQuery = useGetIssuedBooksQuery();
  const books = booksQuery.data ?? [];
  const issued = issuedQuery.data ?? [];

  const summary = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((s, b) => s + Number(b.totalCopies || 0), 0);
    const availableCopies = books.reduce((s, b) => s + Number(b.availableCopies || 0), 0);
    const issuedActive = issued.filter((r) => r.status === 'Issued').length;
    const overdueCount = issued.filter((r) => r.status === 'Overdue').length;
    const returnedCount = issued.filter((r) => r.status === 'Returned').length;
    const lostCount = issued.filter((r) => r.status === 'Lost').length;
    const utilization = totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0;
    const pendingFines = issued.reduce((s, r) => s + (r.fineStatus === 'Pending' ? (r.fine || 0) : 0), 0);
    return { totalTitles, totalCopies, availableCopies, issuedActive, overdueCount, returnedCount, lostCount, utilization, pendingFines };
  }, [books, issued]);

  const categoryData = useMemo(() => {
    const map = {};
    books.forEach((b) => { map[b.category || 'Uncategorized'] = (map[b.category || 'Uncategorized'] || 0) + 1; });
    return Object.entries(map).map(([label, value], i) => ({ label, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })).sort((a, b) => b.value - a.value);
  }, [books]);

  const topBorrowed = useMemo(() => {
    const counts = {};
    issued.forEach((r) => {
      const title = r.bookId?.title || 'Unknown';
      counts[title] = (counts[title] || 0) + 1;
    });
    return Object.entries(counts).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [issued]);

  const isLoading = booksQuery.isLoading || issuedQuery.isLoading;
  const isError = booksQuery.isError || issuedQuery.isError;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="chart-bar" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Library Reports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Collection utilization, circulation and fines
          </Text>
        </View>
      </View>

      <QueryState isLoading={isLoading} isError={isError} error={booksQuery.error || issuedQuery.error} onRetry={() => { booksQuery.refetch(); issuedQuery.refetch(); }} isEmpty={false}>
        <View style={{ marginBottom: spacing.lg }}>
          <StatGrid>
            <StatCard label="Book Titles" metric={{ icon: 'book-outline', color: '#14B8A6', value: summary.totalTitles }} />
            <StatCard label="Total Copies" metric={{ icon: 'file-document-outline', color: '#0891B2', value: summary.totalCopies }} />
            <StatCard label="Available" metric={{ icon: 'check-circle-outline', color: '#22C55E', value: summary.availableCopies }} />
            <StatCard label="Issued" metric={{ icon: 'book-arrow-right-outline', color: '#F59E0B', value: summary.issuedActive }} />
            <StatCard label="Overdue" metric={{ icon: 'alert-outline', color: '#EF4444', value: summary.overdueCount }} />
            <StatCard label="Lost" metric={{ icon: 'alert-outline', color: '#14B8A6', value: summary.lostCount }} />
            <StatCard label="Pending Fines" metric={{ icon: 'cash-multiple', color: '#F59E0B', value: summary.pendingFines, format: 'currency' }} />
          </StatGrid>
        </View>

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Collection Utilization</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text style={[typography.caption, { color: colors.textMuted }]}>{summary.totalCopies - summary.availableCopies} of {summary.totalCopies} copies in circulation</Text>
            <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>{summary.utilization}%</Text>
          </View>
          <ProgressBar progress={summary.utilization / 100} color="#14B8A6" style={{ height: 8, borderRadius: 4 }} />
        </Panel>

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Books by Category</Text>
          <QueryState isLoading={false} isError={false} isEmpty={categoryData.length === 0} emptyIcon="book-outline" emptyLabel="No books added yet">
            <VerticalBarChart data={categoryData} color="#14B8A6" />
          </QueryState>
        </Panel>

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md }]}>Top Borrowed Books</Text>
          <QueryState isLoading={false} isError={false} isEmpty={topBorrowed.length === 0} emptyIcon="book-arrow-right-outline" emptyLabel="No circulation data yet">
            {topBorrowed.map((item, i) => (
              <View key={item.title} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: i < topBorrowed.length - 1 ? 1 : 0, borderBottomColor: colors.borderMuted }}>
                <Text style={[typography.bodyStrong, { color: '#14B8A6', width: 24 }]}>{i + 1}</Text>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{item.count} issues</Text>
              </View>
            ))}
          </QueryState>
        </Panel>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {[
            { label: 'Issued', value: summary.issuedActive, color: '#F59E0B' },
            { label: 'Returned', value: summary.returnedCount, color: '#22C55E' },
            { label: 'Overdue', value: summary.overdueCount, color: '#EF4444' },
            { label: 'Lost', value: summary.lostCount, color: '#14B8A6' },
          ].map((s) => (
            <View key={s.label} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: `${s.color}18`, borderRadius: 12, padding: spacing.md, alignItems: 'center' }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: s.color }}>{s.value}</Text>
              <Text style={[typography.caption, { color: s.color, fontWeight: '700', textTransform: 'uppercase' }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </QueryState>
    </ScreenContainer>
  );
}

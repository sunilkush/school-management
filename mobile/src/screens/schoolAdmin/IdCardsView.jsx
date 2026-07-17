import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { GenerateIdCardSheet } from './GenerateIdCardSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeactivateIdCardMutation, useGetIdCardsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Active: '#22C55E', Inactive: '#94A3B8' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** School Admin/Principal/Vice Principal management view — same ID_CARD_ROLES gate as web's
 * idCard.routes.js. Deactivate fires immediately on tap, no confirm dialog — matches this app's
 * own established pattern for destructive actions (see BooksScreen's delete button). */
export function IdCardsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [generating, setGenerating] = useState(false);

  const params = useMemo(() => ({ search: search.trim() || undefined, status: status || undefined, limit: 50 }), [search, status]);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetIdCardsQuery(params);
  const cards = data?.cards ?? [];
  const [deactivateIdCard, deactivateState] = useDeactivateIdCardMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="card-account-details-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>ID Cards</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {data?.pagination?.total ?? cards.length} issued
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setGenerating(true)} compact>Generate</Button>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or card no." style={{ marginBottom: spacing.sm }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        <Chip selected={!status} onPress={() => setStatus(null)}>All</Chip>
        <Chip selected={status === 'Active'} onPress={() => setStatus('Active')}>Active</Chip>
        <Chip selected={status === 'Inactive'} onPress={() => setStatus('Inactive')}>Inactive</Chip>
      </ScrollView>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={cards.length === 0}
        emptyIcon="card-account-details-outline"
        emptyLabel={search || status ? 'No ID cards match these filters' : 'No ID cards generated yet'}
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading ID cards…'}
      >
        {cards.map((card) => (
          <AccentListCard
            key={card._id}
            accent={STATUS_COLOR[card.status] || colors.primary}
            avatar={<AvatarInitials name={card.fullName} size={40} />}
            title={card.fullName}
            subtitle={card.cardNumber}
            badge={<StatusPill label={card.status} color={STATUS_COLOR[card.status] || colors.textMuted} />}
            meta={[
              { label: 'Class', value: [card.className, card.sectionName].filter(Boolean).join(' - ') || '—' },
              { label: 'Roll No.', value: card.rollNumber || '—' },
              { label: 'Issue Date', value: fmtDate(card.issueDate) },
              { label: 'Valid Until', value: fmtDate(card.validUntil) },
            ]}
            expandable
            actions={card.status === 'Active' ? (
              <Button compact textColor={colors.danger} disabled={deactivateState.isLoading} onPress={() => deactivateIdCard(card._id)}>
                Deactivate
              </Button>
            ) : null}
          />
        ))}
      </QueryState>

      <GenerateIdCardSheet visible={generating} onDismiss={() => setGenerating(false)} onCreated={() => setGenerating(false)} />
    </ScreenContainer>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyIdCardsQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Active: '#22C55E', Inactive: '#94A3B8' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Student and Parent self-service — same shape/reuse rationale as MyCertificatesView, via the
 * parameterless GET /id-cards/my. PDF download deliberately not wired — see apiSlice.js. */
export function MyIdCardView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyIdCardsQuery();
  const cards = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="card-account-details-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>ID Card</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Issued by the school
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={cards.length === 0}
        emptyIcon="card-account-details-outline"
        emptyLabel="No ID card issued yet"
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
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
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

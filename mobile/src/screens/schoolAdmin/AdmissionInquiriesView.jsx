import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateAdmissionInquirySheet } from './CreateAdmissionInquirySheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useDeleteAdmissionInquiryMutation,
  useGetAdmissionInquiriesQuery,
  useGetAdmissionInquiryStatsQuery,
  useUpdateAdmissionInquiryMutation,
} from '../../store/api/apiSlice';

const STATUS_COLOR = {
  new: '#2563EB',
  contacted: '#0891B2',
  visit_scheduled: '#7C3AED',
  docs_submitted: '#F59E0B',
  approved: '#22C55E',
  enrolled: '#16A34A',
  rejected: '#EF4444',
  waitlist: '#94A3B8',
};
const STATUS_OPTIONS = [null, 'new', 'contacted', 'visit_scheduled', 'docs_submitted', 'approved', 'enrolled', 'rejected', 'waitlist'];
const NEXT_STATUS = {
  new: 'contacted',
  contacted: 'visit_scheduled',
  visit_scheduled: 'docs_submitted',
  docs_submitted: 'approved',
  approved: 'enrolled',
  enrolled: 'enrolled',
  rejected: 'new',
  waitlist: 'contacted',
};

/** Pre-admission lead tracking — mirrors frontend's Teachers_&_Students/AdmissionInquiry.jsx.
 * Distinct from actual student enrollment (StudentAdmissionView); conversion to a real Student
 * isn't implemented server-side, so this stops at "approved/enrolled" status, not a real link. */
export function AdmissionInquiriesView() {
  const { colors, typography, spacing } = useAppTheme();
  const [status, setStatus] = useState(null);
  const [creating, setCreating] = useState(false);

  const statsQuery = useGetAdmissionInquiryStatsQuery();
  const stats = statsQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdmissionInquiriesQuery({ status: status || undefined });
  const inquiries = data?.inquiries ?? data ?? [];
  const [updateInquiry, updateState] = useUpdateAdmissionInquiryMutation();
  const [deleteInquiry] = useDeleteAdmissionInquiryMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="New" metric={{ label: 'New', icon: 'account-plus-outline', color: '#2563EB', value: stats.new ?? 0 }} />
          <StatCard label="Approved" metric={{ label: 'Approved', icon: 'check-circle-outline', color: '#22C55E', value: stats.approved ?? 0 }} />
          <StatCard label="Enrolled" metric={{ label: 'Enrolled', icon: 'school-outline', color: '#16A34A', value: stats.enrolled ?? 0 }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Inquiry
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        {STATUS_OPTIONS.map((s) => (
          <Chip key={s || 'all'} selected={status === s} onPress={() => setStatus(s)}>
            {s ? s.replace('_', ' ') : 'All'}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={inquiries.length === 0}
        emptyIcon="comment-question-outline"
        emptyLabel="No admission inquiries yet"
      >
        {inquiries.map((inq) => (
          <AccentListCard
            key={inq._id}
            accent={STATUS_COLOR[inq.status] || colors.primary}
            avatar={<IconWell icon="comment-question-outline" color={STATUS_COLOR[inq.status] || colors.primary} size={40} />}
            title={inq.studentName}
            subtitle={`Applying for ${inq.applyingClass}`}
            badge={<StatusPill label={inq.status.replace('_', ' ')} color={STATUS_COLOR[inq.status] || colors.textMuted} />}
            meta={[
              { label: 'Parent', value: `${inq.parentName} (${inq.relationship})` },
              { label: 'Phone', value: inq.parentPhone },
              { label: 'Source', value: inq.source?.replace('_', ' ') ?? '—' },
              ...(inq.notes ? [{ label: 'Notes', value: inq.notes }] : []),
            ]}
            expandable
            actions={
              <>
                <Button
                  size="small"
                  mode="contained-tonal"
                  onPress={() => updateInquiry({ id: inq._id, status: NEXT_STATUS[inq.status] })}
                  loading={updateState.isLoading}
                  disabled={updateState.isLoading}
                >
                  Advance
                </Button>
                <Button size="small" textColor={colors.danger} onPress={() => deleteInquiry(inq._id)}>
                  Delete
                </Button>
              </>
            }
          />
        ))}
      </QueryState>

      <CreateAdmissionInquirySheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </ScreenContainer>
  );
}

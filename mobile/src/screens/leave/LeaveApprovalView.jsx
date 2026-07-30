import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { RejectLeaveSheet } from './RejectLeaveSheet';
import { LEAVE_STATUS_META } from '../../utils/leave';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useApproveLeaveRequestMutation, useGetLeaveRequestsForSchoolQuery } from '../../store/api/apiSlice';

/** Mirrors frontend/src/pages/School_Admin/Attendance/LeaveManagement.jsx. "Create leave on behalf
 * of any user by raw User ID" (an odd, low-value web-only affordance) is not ported. */
export function LeaveApprovalView() {
  const { colors, spacing } = useAppTheme();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejecting, setRejecting] = useState(null);

  // Backend default limit=20 with no override would silently truncate once "All" is selected
  // (the default 'pending' filter is naturally small, but the unfiltered view isn't).
  const { data, isLoading, isFetching, isError, error, refetch } = useGetLeaveRequestsForSchoolQuery({ status: statusFilter || undefined, limit: 500 });
  const [approveLeaveRequest, approveState] = useApproveLeaveRequestMutation();
  const requests = data?.requests ?? [];

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
        <Chip selected={!statusFilter} onPress={() => setStatusFilter(null)}>
          All
        </Chip>
        {Object.keys(LEAVE_STATUS_META).map((s) => (
          <Chip key={s} selected={s === statusFilter} onPress={() => setStatusFilter(s)}>
            {LEAVE_STATUS_META[s].label}
          </Chip>
        ))}
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={requests.length === 0}
        emptyIcon="calendar-remove-outline"
        emptyLabel="No leave requests match this filter"
      >
        {requests.map((r) => {
          const meta = LEAVE_STATUS_META[r.status] ?? LEAVE_STATUS_META.pending;
          return (
            <AccentListCard
              key={r._id}
              accent={meta.color}
              avatar={<AvatarInitials name={r.userId?.name} size={40} />}
              title={r.userId?.name ?? 'Unknown'}
              subtitle={`${r.leaveType[0].toUpperCase() + r.leaveType.slice(1)} · ${formatDate(r.startDate)} — ${formatDate(r.endDate)} · ${r.totalDays}d`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              meta={[{ label: 'Reason', value: r.reason }]}
              expandable
              actions={
                r.status === 'pending' ? (
                  <>
                    <Button mode="outlined" compact textColor={colors.danger} onPress={() => setRejecting(r)}>
                      Reject
                    </Button>
                    <Button mode="contained" compact loading={approveState.isLoading} disabled={approveState.isLoading} onPress={() => approveLeaveRequest(r._id)}>
                      Approve
                    </Button>
                  </>
                ) : null
              }
            />
          );
        })}
      </QueryState>

      <RejectLeaveSheet request={rejecting} onDismiss={() => setRejecting(null)} onRejected={() => setRejecting(null)} />
    </View>
  );
}

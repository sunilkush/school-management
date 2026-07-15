import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { ApplyLeaveSheet } from './ApplyLeaveSheet';
import { LEAVE_STATUS_META } from '../../utils/leave';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCancelLeaveRequestMutation, useGetMyLeaveRequestsQuery } from '../../store/api/apiSlice';

/** Self-service apply/track — mirrors the same simple pattern repeated across ~18 web pages
 * (Teacher/Student/every-other-employee-role's own leave page). Pass targetUserId/targetRoleName
 * for a Parent viewing/applying for a verified child (both default to the caller). */
export function LeaveSelfServiceView({ targetUserId, targetRoleName }) {
  const { colors } = useAppTheme();
  const { role } = useAuth();
  const [applying, setApplying] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyLeaveRequestsQuery({ userId: targetUserId });
  const [cancelLeaveRequest, cancelState] = useCancelLeaveRequestMutation();
  const requests = data ?? [];

  const stats = [
    { key: 'total', label: 'Total', icon: 'calendar-clock-outline', color: colors.primary, value: requests.length },
    { key: 'pending', label: 'Pending', icon: 'clock-outline', color: '#F59E0B', value: requests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', icon: 'check-circle-outline', color: '#22C55E', value: requests.filter((r) => r.status === 'approved').length },
  ];

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button mode="contained" icon="plus" onPress={() => setApplying(true)}>
          Apply for Leave
        </Button>
      </View>

      <View style={{ marginBottom: 16 }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={requests.length === 0}
        emptyIcon="calendar-remove-outline"
        emptyLabel="No leave requests yet"
      >
        {requests.map((r) => {
          const meta = LEAVE_STATUS_META[r.status] ?? LEAVE_STATUS_META.pending;
          return (
            <AccentListCard
              key={r._id}
              accent={meta.color}
              avatar={<IconWell icon="calendar-clock-outline" color={meta.color} size={38} />}
              title={r.leaveType[0].toUpperCase() + r.leaveType.slice(1) + ' Leave'}
              subtitle={`${formatDate(r.startDate)} — ${formatDate(r.endDate)} · ${r.totalDays} day(s)`}
              badge={<StatusPill label={meta.label} color={meta.color} />}
              meta={[
                { label: 'Reason', value: r.reason },
                { label: 'Rejection Reason', value: r.rejectionReason },
              ]}
              expandable
              actions={
                r.status === 'pending' ? (
                  <IconButton
                    icon="close-circle-outline"
                    iconColor={colors.danger}
                    size={18}
                    disabled={cancelState.isLoading}
                    onPress={() => cancelLeaveRequest(r._id)}
                  />
                ) : null
              }
            />
          );
        })}
      </QueryState>

      <ApplyLeaveSheet
        visible={applying}
        onDismiss={() => setApplying(false)}
        onCreated={() => setApplying(false)}
        roleName={role?.name}
        targetUserId={targetUserId}
        targetRoleName={targetRoleName}
      />
    </View>
  );
}

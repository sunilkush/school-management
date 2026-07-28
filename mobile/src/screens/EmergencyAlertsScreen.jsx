import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { RaiseEmergencyAlertSheet } from './security/RaiseEmergencyAlertSheet';
import { formatDate } from '../utils/format';
import { confirmDelete } from '../utils/confirm';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteEmergencyAlertMutation, useGetEmergencyAlertsQuery, useResolveEmergencyAlertMutation } from '../store/api/apiSlice';

const SEVERITY_COLOR = { Low: '#94A3B8', Medium: '#F59E0B', High: '#EF4444' };

/** Real, fully-persisted feature (EmergencyAlert model) — mirrors
 * frontend/src/pages/Security/SecurityPages.jsx's EmergencyAlerts section: raise + list +
 * resolve + delete, no fake/local-only state involved. */
export function EmergencyAlertsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [raising, setRaising] = useState(false);

  // Backend default limit=50 with no override would silently truncate the alert history — safety
  // relevant, so err on the side of showing everything.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetEmergencyAlertsQuery({ limit: 500 });
  const alerts = data?.alerts ?? data ?? [];
  const [resolveAlert, resolveState] = useResolveEmergencyAlertMutation();
  const [deleteAlert, deleteState] = useDeleteEmergencyAlertMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="shield-alert-outline" color={colors.danger} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Emergency Alerts</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="alert-outline" buttonColor={colors.danger} onPress={() => setRaising(true)}>
          Raise Alert
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={alerts.length === 0}
        emptyIcon="shield-check-outline"
        emptyLabel="No emergency alerts raised"
      >
        {alerts.map((a) => (
          <AccentListCard
            key={a._id}
            accent={a.isResolved ? colors.success : (SEVERITY_COLOR[a.severity] || colors.primary)}
            avatar={<IconWell icon="shield-alert-outline" color={a.isResolved ? colors.success : (SEVERITY_COLOR[a.severity] || colors.primary)} size={40} />}
            title={a.type}
            subtitle={a.location}
            badge={
              a.isResolved
                ? <StatusPill label="Resolved" color={colors.success} />
                : <StatusPill label={`${a.severity} Severity`} color={SEVERITY_COLOR[a.severity] || colors.textMuted} />
            }
            meta={[
              ...(a.description ? [{ label: 'Description', value: a.description }] : []),
              { label: 'Raised By', value: a.raisedBy?.name ?? '—' },
              { label: 'Raised At', value: formatDate(a.raisedAt) },
              ...(a.isResolved ? [
                { label: 'Resolved By', value: a.resolvedBy?.name ?? '—' },
                { label: 'Resolved At', value: formatDate(a.resolvedAt) },
                ...(a.resolution ? [{ label: 'Resolution', value: a.resolution }] : []),
              ] : []),
            ]}
            expandable
            actions={
              <>
                {!a.isResolved && (
                  <Button size="small" mode="contained-tonal" compact disabled={resolveState.isLoading} onPress={() => resolveAlert({ id: a._id })}>
                    Mark Resolved
                  </Button>
                )}
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteAlert(a._id), 'this alert')} />
              </>
            }
          />
        ))}
      </QueryState>

      <RaiseEmergencyAlertSheet visible={raising} onDismiss={() => setRaising(false)} onCreated={() => setRaising(false)} />
    </ScreenContainer>
  );
}

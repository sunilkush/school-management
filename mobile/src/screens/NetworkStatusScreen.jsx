import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetHealthStatusQuery } from '../store/api/apiSlice';

const DB_COLOR = { connected: '#22C55E', connecting: '#F59E0B', disconnected: '#EF4444' };

function formatUptime(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** A live system-health ping — mirrors frontend/src/pages/IT_Support/ITSupportPages.jsx's
 * NetworkStatus section, which is genuinely just GET /health polled every 60s (no auth even
 * required on that route) rather than a real network-monitoring dashboard; ported as-is, not
 * built up into something more elaborate the real feature isn't. */
export function NetworkStatusScreen() {
  const { colors, typography, spacing } = useAppTheme();

  const { data, isLoading, isFetching, isError, error, refetch } = useGetHealthStatusQuery(undefined, {
    pollingInterval: 60000,
  });

  const isHealthy = data?.status === 'ok';
  const dbStatus = data?.db ?? 'disconnected';

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="wifi" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Network Status</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Refreshes automatically every minute
          </Text>
        </View>
        <IconButton icon="refresh" onPress={refetch} disabled={isFetching} />
      </View>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!data}
        emptyIcon="wifi-off"
        emptyLabel="Unable to reach the server"
      >
        <StatGrid>
          <StatCard
            label="API Server"
            metric={{ label: 'API Server', icon: isHealthy ? 'check-circle-outline' : 'close-circle-outline', color: isHealthy ? '#22C55E' : '#EF4444', value: isHealthy ? 'Online' : 'Down' }}
          />
          <StatCard
            label="Database"
            metric={{ label: 'Database', icon: 'database-outline', color: DB_COLOR[dbStatus] || colors.textMuted, value: dbStatus }}
          />
          <StatCard
            label="Backend Uptime"
            metric={{ label: 'Backend Uptime', icon: 'clock-outline', color: '#2563EB', value: formatUptime(data?.uptime) }}
          />
        </StatGrid>
      </QueryState>
    </ScreenContainer>
  );
}

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
import { LogHealthVisitSheet } from './LogHealthVisitSheet';
import { UpdateHealthVisitSheet } from './UpdateHealthVisitSheet';
import { HealthProfileSheet } from './HealthProfileSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetHealthVisitsQuery } from '../../store/api/apiSlice';

const SEVERITY_COLOR = { Minor: '#F59E0B', Moderate: '#F97316', Severe: '#EF4444' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/**
 * Medical Officer's core screen — also read+write for School Admin/Principal/Vice Principal, same
 * HEALTH_ROLES gate as web's healthRecord.routes.js. The visit list (no studentId filter) is the
 * primary view since it needs no class/section picker up front.
 */
export function HealthRecordsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState(null);
  const [logging, setLogging] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [profileStudentId, setProfileStudentId] = useState(null);

  const params = useMemo(() => ({
    search: search.trim() || undefined,
    severity: severity || undefined,
    limit: 50,
  }), [search, severity]);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetHealthVisitsQuery(params);
  const visits = data?.visits ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="medical-bag" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Health Records</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Recent clinic visits across the school
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setLogging(true)} compact>
          Log Visit
        </Button>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by student name" style={{ marginBottom: spacing.sm }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        <Chip selected={!severity} onPress={() => setSeverity(null)}>All</Chip>
        {['Minor', 'Moderate', 'Severe'].map((s) => (
          <Chip key={s} selected={severity === s} onPress={() => setSeverity(s)}>{s}</Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={visits.length === 0}
        emptyIcon="medical-bag"
        emptyLabel={search || severity ? 'No visits match these filters' : 'No clinic visits logged yet'}
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading visits…'}
      >
        {visits.map((visit) => (
          <AccentListCard
            key={visit._id}
            accent={SEVERITY_COLOR[visit.severity] || colors.primary}
            avatar={<AvatarInitials name={visit.studentName} size={40} />}
            title={visit.studentName || 'Unknown Student'}
            subtitle={[visit.className, visit.sectionName].filter(Boolean).join(' · ') || fmtDate(visit.visitDate)}
            badge={<StatusPill label={visit.severity} color={SEVERITY_COLOR[visit.severity] || colors.textMuted} />}
            meta={[
              { label: 'Symptoms', value: visit.symptoms },
              { label: 'Date', value: fmtDate(visit.visitDate) },
              { label: 'Status', value: visit.status ?? 'Open' },
              { label: 'Follow-up', value: visit.followUpDate ? fmtDate(visit.followUpDate) : '—' },
              { label: 'Referred', value: visit.referredToHospital ? (visit.referredTo || 'Yes') : 'No' },
              { label: 'Parent Notified', value: visit.parentNotified ? 'Yes' : 'No' },
            ]}
            expandable
            actions={
              <>
                <Button compact onPress={() => setProfileStudentId(visit.studentId)}>Profile</Button>
                <Button compact mode="contained-tonal" onPress={() => setEditingVisit(visit)}>Update</Button>
              </>
            }
          />
        ))}
      </QueryState>

      <LogHealthVisitSheet visible={logging} onDismiss={() => setLogging(false)} onCreated={() => setLogging(false)} />
      <UpdateHealthVisitSheet visit={editingVisit} onDismiss={() => setEditingVisit(null)} />
      <HealthProfileSheet studentId={profileStudentId} onDismiss={() => setProfileStudentId(null)} />
    </ScreenContainer>
  );
}

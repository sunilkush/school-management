import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyCertificatesQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Issued: '#22C55E', Revoked: '#EF4444' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/**
 * Student and Parent self-service — reused for both NAV_CONFIG keys (Student sees their own,
 * Parent sees every linked child's, both via the same parameterless GET /certificates/my — the
 * backend's resolveMyStudentIds already resolves "which student(s)" server-side, so no
 * ChildPicker is needed here; each row's already-denormalized studentName tells a Parent whose
 * certificate it is. PDF download deliberately not wired — see apiSlice.js's Certificates comment.
 */
export function MyCertificatesView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyCertificatesQuery();
  const certificates = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="certificate-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Certificates</Text>
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
        isEmpty={certificates.length === 0}
        emptyIcon="certificate-outline"
        emptyLabel="No certificates issued yet"
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
      >
        {certificates.map((cert) => (
          <AccentListCard
            key={cert._id}
            accent={STATUS_COLOR[cert.status] || colors.primary}
            avatar={<IconWell icon="certificate-outline" color={STATUS_COLOR[cert.status] || colors.primary} size={40} />}
            title={cert.certificateType}
            subtitle={`${cert.studentName} · ${cert.certificateNumber}`}
            badge={<StatusPill label={cert.status} color={STATUS_COLOR[cert.status] || colors.textMuted} />}
            meta={[
              { label: 'Class', value: [cert.className, cert.sectionName].filter(Boolean).join(' - ') || '—' },
              { label: 'Issue Date', value: fmtDate(cert.issueDate) },
              { label: 'Purpose', value: cert.purpose || cert.reasonForLeaving || '—' },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

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
import { GenerateCertificateSheet } from './GenerateCertificateSheet';
import { RevokeCertificateSheet } from './RevokeCertificateSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetCertificatesQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { Issued: '#22C55E', Revoked: '#EF4444' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** School Admin/Principal/Vice Principal management view — same CERTIFICATE_ROLES gate as web's
 * certificate.routes.js. PDF export deliberately not wired here (see apiSlice.js's Certificates
 * comment for why). */
export function CertificatesView() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const params = useMemo(() => ({ search: search.trim() || undefined, status: status || undefined, limit: 50 }), [search, status]);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetCertificatesQuery(params);
  const certificates = data?.certificates ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="certificate-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Certificates</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {data?.pagination?.total ?? certificates.length} issued
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => setGenerating(true)} compact>Generate</Button>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by student or certificate no." style={{ marginBottom: spacing.sm }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
        <Chip selected={!status} onPress={() => setStatus(null)}>All</Chip>
        <Chip selected={status === 'Issued'} onPress={() => setStatus('Issued')}>Issued</Chip>
        <Chip selected={status === 'Revoked'} onPress={() => setStatus('Revoked')}>Revoked</Chip>
      </ScrollView>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={certificates.length === 0}
        emptyIcon="certificate-outline"
        emptyLabel={search || status ? 'No certificates match these filters' : 'No certificates generated yet'}
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading certificates…'}
      >
        {certificates.map((cert) => (
          <AccentListCard
            key={cert._id}
            accent={STATUS_COLOR[cert.status] || colors.primary}
            avatar={<AvatarInitials name={cert.studentName} size={40} />}
            title={cert.studentName}
            subtitle={cert.certificateNumber}
            badge={<StatusPill label={cert.status} color={STATUS_COLOR[cert.status] || colors.textMuted} />}
            meta={[
              { label: 'Type', value: cert.certificateType },
              { label: 'Class', value: [cert.className, cert.sectionName].filter(Boolean).join(' - ') || '—' },
              { label: 'Issue Date', value: fmtDate(cert.issueDate) },
              { label: 'Purpose', value: cert.purpose || cert.reasonForLeaving || '—' },
            ]}
            expandable
            actions={cert.status === 'Issued' ? <Button compact textColor={colors.danger} onPress={() => setRevoking(cert)}>Revoke</Button> : null}
          />
        ))}
      </QueryState>

      <GenerateCertificateSheet visible={generating} onDismiss={() => setGenerating(false)} onCreated={() => setGenerating(false)} />
      <RevokeCertificateSheet certificate={revoking} onDismiss={() => setRevoking(null)} />
    </ScreenContainer>
  );
}

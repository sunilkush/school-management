import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { pillStyle, STATUS_SEMANTICS } from '../theme/patterns';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetSubjectsQuery } from '../store/api/apiSlice';

/** Read-only subject catalog — mirrors the web app's Subjects page (frontend/src/pages/
 * School_Admin/Academic_Management/Subjects.jsx) minus create/edit/assign-teachers/assign-schools,
 * which are separate write flows not built here. */
export function SubjectsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSubjectsQuery();
  const subjects = data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((s) => [s.name, s.code, s.category].some((f) => f?.toLowerCase?.().includes(query)));
  }, [subjects, search]);

  const stats = [
    { key: 'total', label: 'Total Subjects', icon: 'book-open-variant', color: colors.primary, value: subjects.length },
    { key: 'active', label: 'Active', icon: 'check-circle-outline', color: '#10B981', value: subjects.filter((s) => s.isActive).length },
    { key: 'global', label: 'Global', icon: 'earth', color: '#7C3AED', value: subjects.filter((s) => s.isGlobal).length },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="book-open-variant" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Subjects</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Subject catalog for this school
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name, code or category" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="book-remove-outline"
        emptyLabel={search ? 'No subjects match your search' : 'No subjects found'}
      >
        {filtered.map((s) => (
          <AccentListCard
            key={s._id}
            accent={s.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
            avatar={<IconWell icon="book-open-variant" color={colors.primary} size={38} />}
            title={s.name}
            subtitle={[s.code, s.category].filter(Boolean).join(' · ')}
            badge={
              <View style={pillStyle(s.isGlobal ? '#7C3AED' : '#2563EB')}>
                <Text style={[typography.caption, { color: s.isGlobal ? '#7C3AED' : '#2563EB', fontWeight: '700', fontSize: 10.5 }]}>
                  {s.isGlobal ? 'Global' : 'School'}
                </Text>
              </View>
            }
            meta={[
              { label: 'Type', value: s.type },
              { label: 'Max Marks', value: s.maxMarks },
              { label: 'Pass Marks', value: s.passMarks },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}

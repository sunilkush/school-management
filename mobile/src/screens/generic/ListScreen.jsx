import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Divider, FAB, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { FilterChips } from './FilterChips';
import { ScopePicker } from './ScopePicker';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { toneColor } from '../../modules/tone';

function Row({ presentation, onPress, disabled }) {
  const { colors, typography, spacing } = useAppTheme();
  const { title, subtitle, meta, badge, unread } = presentation;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={disabled ? undefined : { color: colors.borderMuted }}
      style={({ pressed }) => ({
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        opacity: pressed && !disabled ? 0.6 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={2}
          style={[unread ? typography.bodyStrong : typography.body, { color: colors.text }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{meta}</Text>
        ) : null}
      </View>
      {/* A descriptor names a tone from the shared status vocabulary; one with its own
          established colour scale (attendance's five statuses) passes a colour directly. */}
      {badge ? <StatusPill label={badge.label} color={badge.color ?? toneColor(badge.tone, colors)} /> : null}
    </Pressable>
  );
}

/**
 * Renders any module descriptor's list. Everything variable — where the rows come from, how one
 * row reads, what can be filtered, whether tapping opens a detail — arrives as data from
 * `src/modules/definitions/*`, so adding a module means writing a descriptor, not a screen.
 *
 * Search and filtering are client-side by default because most of these backend list endpoints
 * have no query params for them; a descriptor whose endpoint DOES support server-side filtering
 * sets `filter.server` and receives the value in its own `useList` args instead.
 */
export function createListScreen(descriptor) {
  return function ModuleListScreen({ navigation }) {
    const { colors, spacing, typography } = useAppTheme();
    const ctx = useModuleContext();
    const [search, setSearch] = useState('');
    const [filterValue, setFilterValue] = useState(descriptor.filter?.initial ?? null);

    // Whose data this list is about (a Parent's selected child, say). `useOptions` is a hook, so
    // it runs whenever the descriptor declares a scope at all — it skips its own request for roles
    // the scope does not apply to.
    const scopeActive = Boolean(descriptor.scope?.activeFor(ctx));
    const scopeQuery = descriptor.scope ? descriptor.scope.useOptions(ctx) : null;
    const scopeOptions = scopeActive ? descriptor.scope.selectOptions(scopeQuery?.data) ?? [] : [];
    const [scopePick, setScopePick] = useState(null);
    // Default to the first option rather than making the user choose before seeing anything.
    const scope = scopeActive ? scopePick ?? scopeOptions[0]?.value ?? null : undefined;

    const serverFilter = descriptor.filter?.server ? filterValue : undefined;
    const result = descriptor.useList(ctx, { filter: serverFilter, scope });
    const { data, isLoading, isError, error, refetch, isFetching } = result;

    // A scoped list with nothing to scope to has no query to run and no rows to promise.
    const scopeUnavailable = scopeActive && !scopeQuery?.isLoading && scopeOptions.length === 0;

    const rows = useMemo(() => {
      const all = descriptor.selectRows ? descriptor.selectRows(data) : data ?? [];
      const list = Array.isArray(all) ? all : [];

      const searched = search.trim() && descriptor.searchFields
        ? list.filter((row) => {
            const needle = search.trim().toLowerCase();
            return descriptor.searchFields.some((get) => String(get(row) ?? '').toLowerCase().includes(needle));
          })
        : list;

      // A server-side filter is already applied by the query itself — re-applying it here would
      // double-filter against fields the response may not even carry.
      if (!descriptor.filter || descriptor.filter.server || filterValue == null) return searched;
      return searched.filter((row) => descriptor.filter.apply(row, filterValue));
    }, [data, search, filterValue]);

    const openDetail = useCallback(
      (row) => navigation.navigate('ModuleDetail', { row, title: descriptor.detail?.titleFor?.(row) }),
      [navigation]
    );

    const canCreate = Boolean(descriptor.create?.allow(ctx));

    return (
      <ScreenContainer>
        {scopeActive ? (
          <ScopePicker options={scopeOptions} value={scope} onChange={setScopePick} />
        ) : null}

        {descriptor.searchFields ? (
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder={descriptor.searchPlaceholder ?? 'Search'}
            style={{ marginBottom: spacing.sm }}
          />
        ) : null}

        {descriptor.filter ? (
          <FilterChips
            options={descriptor.filter.options}
            value={filterValue}
            onChange={setFilterValue}
            allLabel={descriptor.filter.allLabel}
          />
        ) : null}

        <QueryState
          isLoading={isLoading || Boolean(scopeQuery?.isLoading)}
          isError={isError}
          error={error}
          onRetry={refetch}
          isEmpty={scopeUnavailable || rows.length === 0}
          emptyIcon={descriptor.emptyIcon}
          emptyLabel={
            scopeUnavailable
              ? descriptor.scope.emptyLabel
              : search.trim()
                ? 'Nothing matches that search'
                : descriptor.emptyLabel
          }
        >
          <FlatList
            data={rows}
            keyExtractor={(row, index) => String(descriptor.rowKey?.(row) ?? row?._id ?? index)}
            ItemSeparatorComponent={() => <Divider style={{ backgroundColor: colors.borderMuted }} />}
            // Summary tiles scroll WITH the list rather than sitting in a fixed band above it —
            // on a phone a pinned header would eat most of the screen before a single row shows.
            // Computed from the rows on screen, so it always agrees with what is listed below it.
            ListHeaderComponent={
              descriptor.summary ? (
                <View style={{ marginBottom: spacing.md }}>
                  <StatGrid>
                    {descriptor.summary(rows, ctx).map((stat) => (
                      <StatCard key={stat.label} label={stat.label} metric={stat} />
                    ))}
                  </StatGrid>
                </View>
              ) : null
            }
            refreshing={isFetching}
            onRefresh={refetch}
            contentContainerStyle={{ paddingBottom: canCreate ? 88 : spacing.lg }}
            renderItem={({ item }) => (
              <Row
                presentation={descriptor.row(item, ctx)}
                disabled={!descriptor.detail}
                onPress={() => openDetail(item)}
              />
            )}
            ListFooterComponent={
              descriptor.footerNote ? (
                <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.lg }]}>
                  {descriptor.footerNote}
                </Text>
              ) : null
            }
          />
        </QueryState>

        {canCreate ? (
          <FAB
            icon={descriptor.create.icon ?? 'plus'}
            label={descriptor.create.label}
            onPress={() => navigation.navigate('ModuleForm')}
            style={{ position: 'absolute', right: spacing.lg, bottom: spacing.lg, backgroundColor: colors.primary }}
            color="#FFFFFF"
          />
        ) : null}
      </ScreenContainer>
    );
  };
}

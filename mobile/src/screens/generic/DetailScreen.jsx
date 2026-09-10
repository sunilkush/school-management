import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { toneColor } from '../../modules/tone';
import { confirmDelete } from '../../utils/confirm';

function Field({ label, value }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, marginTop: 2 }]}>{value || '—'}</Text>
    </View>
  );
}

/**
 * Renders one record from a module descriptor's `detail` block.
 *
 * The list already holds every row, so by default the tapped row is passed straight through
 * navigation params and no second request is made. A descriptor whose backend has a genuinely
 * richer per-record endpoint (e.g. Students → GET /student/getStudent/:id) sets `detail.useItem`
 * and this fetches instead.
 */
export function createDetailScreen(descriptor) {
  const detail = descriptor.detail;

  return function ModuleDetailScreen({ route, navigation }) {
    const { colors, typography, spacing } = useAppTheme();
    const ctx = useModuleContext();
    const listRow = route.params?.row;

    // Both branches must be evaluated unconditionally — `useItem` is a hook. Descriptors without
    // one supply a no-op that reports the row it was handed as already-loaded.
    const fetched = detail.useItem
      ? detail.useItem(detail.idFor ? detail.idFor(listRow) : listRow?._id, ctx)
      : { data: listRow, isLoading: false, isError: false };
    const record = detail.useItem ? detail.selectItem?.(fetched.data) ?? fetched.data : listRow;

    // e.g. opening a notification marks it read. Fired once per record, never on every render.
    const [runOnOpen] = detail.useOnOpen ? detail.useOnOpen() : [null];
    const onOpenArg = record && detail.onOpenArg ? detail.onOpenArg(record, ctx) : null;
    useEffect(() => {
      if (runOnOpen && onOpenArg != null) runOnOpen(onOpenArg);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onOpenArg]);

    // Same rule-of-hooks constraint: `actions` is a static array declared at module load, so
    // mapping over it to call each mutation hook keeps the call order stable across renders.
    const actions = detail.actions ?? [];
    // Called for every action, including ones ActionSheet submits instead — an RTK Query mutation
    // hook registers nothing until it is actually fired, so the unused ones cost nothing, and
    // calling them all unconditionally is what keeps hook order stable.
    const actionRunners = actions.map((action) => action.useMutation());

    return (
      <ScreenContainer scrollable>
        <QueryState
          isLoading={fetched.isLoading}
          isError={fetched.isError}
          error={fetched.error}
          onRetry={fetched.refetch}
          isEmpty={!record}
          emptyLabel="This record is no longer available"
        >
          {record ? (
            <>
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.h2, { color: colors.text }]}>{detail.titleFor(record)}</Text>
                {detail.badgeFor?.(record) ? (
                  <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
                    <StatusPill
                      label={detail.badgeFor(record).label}
                      color={detail.badgeFor(record).color ?? toneColor(detail.badgeFor(record).tone, colors)}
                    />
                  </View>
                ) : null}
              </View>

              <Panel>
                {detail.fields(record, ctx).map((field) => (
                  <Field key={field.label} label={field.label} value={field.value} />
                ))}
              </Panel>

              {actions.map((action, index) => {
                if (!action.allow(ctx, record)) return null;
                const [run, state] = actionRunners[index];
                // An action declaring `fields` needs input before it can fire, so it hands off to
                // ActionSheet instead of running here.
                const fire = action.fields
                  ? () => navigation.navigate('ModuleAction', { actionKey: action.key, row: record, title: action.title })
                  : () => {
                      run(action.buildArg(record, ctx))
                        .unwrap()
                        .then(() => navigation.goBack())
                        // errorMiddleware.js already alerts on any rejected mutation — swallowing
                        // here only stops the unhandled-rejection warning, it does not hide it.
                        .catch(() => {});
                    };

                return (
                  <Button
                    key={action.key}
                    mode={action.tone === 'primary' ? 'contained' : 'outlined'}
                    icon={action.icon}
                    loading={state.isLoading}
                    disabled={state.isLoading}
                    onPress={action.confirm ? () => confirmDelete(fire, action.confirmLabel ?? 'this record') : fire}
                    textColor={action.tone === 'danger' ? colors.danger : undefined}
                    style={{ marginBottom: spacing.sm }}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </>
          ) : null}
        </QueryState>
      </ScreenContainer>
    );
  };
}

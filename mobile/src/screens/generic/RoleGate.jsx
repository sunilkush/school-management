import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';

/**
 * Several nav keys mean different things to different roles. "Fees" to a parent is *their child's
 * bill*; to a School Admin it is the school's whole fee ledger. "Attendance" to a student is their
 * own record; to an admin it is the school-wide table. The descriptor behind such a key is written
 * against one of those readings and its endpoints are gated to match — pointing the other role at
 * it would either 403 or, worse, quietly show them the wrong thing under a familiar label.
 *
 * So a descriptor can declare `servesRole`, and everyone else gets told plainly that this
 * particular view is not the one for them yet, instead of an error or a misleading empty list.
 */
export function withRoleGate(descriptor, Inner) {
  if (!descriptor.servesRole) return Inner;

  function RoleGatedScreen(props) {
    const { colors, spacing, typography } = useAppTheme();
    const ctx = useModuleContext();

    if (descriptor.servesRole(ctx)) return <Inner {...props} />;

    return (
      <ScreenContainer>
        <View style={{ alignItems: 'center', marginTop: spacing.xxxl }}>
          <Icon source={descriptor.icon ?? 'shape-outline'} size={44} color={colors.textMuted} />
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>{descriptor.title}</Text>
          <Text
            style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}
          >
            {descriptor.notForRoleLabel ?? 'This view is not available for your role yet.'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // The gate itself renders no header — whatever it wraps decides that.
  RoleGatedScreen.selfHeadered = Inner.selfHeadered;
  return RoleGatedScreen;
}

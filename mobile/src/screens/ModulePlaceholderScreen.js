import React from 'react';
import { View } from 'react-native';
import { Chip, Icon, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useAppTheme } from '../theme/ThemeProvider';

// Every role's nav destinations resolve here until Phase 4 builds the real screen for that
// module. Showing the actual granted actions (not a blank stub) proves the permission wiring
// from resolveRoleNav.js is reaching the right screen with the right data.
export function ModulePlaceholderScreen({ route }) {
  const { colors, typography, spacing } = useAppTheme();
  const { label, icon, actions = [] } = route.params ?? {};

  return (
    <ScreenContainer>
      <View style={{ alignItems: 'center', marginTop: spacing.xxxl }}>
        <Icon source={icon || 'shape-outline'} size={48} color={colors.primary} />
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{label}</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
          The full {label} experience arrives in Phase 4.
        </Text>

        {actions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg }}>
            {actions.map((action) => (
              <Chip key={action} compact>
                {action}
              </Chip>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

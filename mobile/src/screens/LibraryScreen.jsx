import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { LibraryView } from './student/LibraryView';
import { ParentLibraryView } from './parent/ParentLibraryView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const HANDLED_ROLES = new Set(['Student', 'Parent']);

export function LibraryScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="book-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Library</Text>
        </View>
      </View>

      {role?.name === 'Student' && <LibraryView />}
      {role?.name === 'Parent' && <ParentLibraryView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="book-off-outline" emptyLabel="Library view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

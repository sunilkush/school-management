import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { IconWell } from '../components/ui/IconWell';
import { PrincipalMarkAttendanceView } from './attendance/PrincipalMarkAttendanceView';
import { useAppTheme } from '../theme/ThemeProvider';

/** School-wide attendance marking (any class/section, not assignment-restricted) — used by
 * Principal and Super Admin's own Attendance groups. Backend's ADMIN_ATTENDANCE_ROLES enforces
 * who's actually allowed to submit; this screen doesn't role-branch itself. */
export function MarkAttendanceScreen() {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="clipboard-check-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Mark Attendance</Text>
        </View>
      </View>

      <PrincipalMarkAttendanceView />
    </ScreenContainer>
  );
}

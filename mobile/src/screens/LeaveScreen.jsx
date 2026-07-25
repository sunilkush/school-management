import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { LeaveSelfServiceView } from './leave/LeaveSelfServiceView';
import { ParentLeaveView } from './leave/ParentLeaveView';
import { LeaveApprovalView } from './leave/LeaveApprovalView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

// Every employee-type role gets self-service apply/track on the web app (~18 near-identical
// pages) except Super Admin and School Admin — School Admin gets the approval console instead,
// Super Admin has no leave route on web at all. Class Teacher/Sports Teacher both have their own
// web route (classteacher/leave, sportsteacher/leave) rendering the identical TeacherLeave.jsx —
// both were missing here, so tapping "Leave" silently fell to the "not available" placeholder
// even though NAV_CONFIG lists it and the backend (leaveRequest.routes.js POST '/' and GET '/my')
// has no role restriction at all.
const SELF_SERVICE_ROLES = new Set([
  'Principal', 'Vice Principal', 'Teacher', 'Student', 'Accountant',
  'Librarian', 'Hostel Warden', 'Transport Manager', 'Receptionist',
  'Class Teacher', 'Sports Teacher',
]);

export function LeaveScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="calendar-clock-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Leave</Text>
        </View>
      </View>

      {role?.name === 'School Admin' && <LeaveApprovalView />}
      {role?.name === 'Parent' && <ParentLeaveView />}
      {SELF_SERVICE_ROLES.has(role?.name) && <LeaveSelfServiceView />}
      {!SELF_SERVICE_ROLES.has(role?.name) && role?.name !== 'School Admin' && role?.name !== 'Parent' && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="calendar-remove-outline" emptyLabel="Leave view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

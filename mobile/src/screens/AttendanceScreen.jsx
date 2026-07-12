import React from 'react';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { useAuth } from '../hooks/useAuth';
import { MyAttendanceView } from './attendance/MyAttendanceView';
import { ParentAttendanceView } from './attendance/ParentAttendanceView';
import { TeacherMarkAttendanceView } from './attendance/TeacherMarkAttendanceView';
import { HostelWardenAttendanceView } from './attendance/HostelWardenAttendanceView';

const HANDLED_ROLES = new Set(['Student', 'Parent', 'Teacher', 'Hostel Warden']);

export function AttendanceScreen() {
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      {role?.name === 'Student' && <MyAttendanceView />}
      {role?.name === 'Parent' && <ParentAttendanceView />}
      {role?.name === 'Teacher' && <TeacherMarkAttendanceView />}
      {role?.name === 'Hostel Warden' && <HostelWardenAttendanceView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="clipboard-remove-outline" emptyLabel="Attendance view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

import React, { useState } from 'react';
import { SegmentedButtons } from 'react-native-paper';
import { View } from 'react-native';
import { ScheduleTab } from './ScheduleTab';
import { TimeSlotsTab } from './TimeSlotsTab';
import { RoomsTab } from './RoomsTab';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Mirrors the web app's Timetable Planner (frontend/src/pages/Timetable/SchoolAdminTimetablePage.jsx
 * + TimeSlotManager.jsx + RoomManager.jsx), collapsed into one screen with tabs instead of 3
 * separate nav destinations. Copy Week and Bulk Save are deferred as v2 polish — every add/edit/
 * delete here already round-trips individually, matching the core "admin can actually manage the
 * timetable" workflow. */
export function SchoolAdminTimetableView() {
  const { spacing } = useAppTheme();
  const [tab, setTab] = useState('schedule');

  return (
    <View>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        style={{ marginBottom: spacing.lg }}
        buttons={[
          { value: 'schedule', label: 'Schedule' },
          { value: 'slots', label: 'Time Slots' },
          { value: 'rooms', label: 'Rooms' },
        ]}
      />

      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'slots' && <TimeSlotsTab />}
      {tab === 'rooms' && <RoomsTab />}
    </View>
  );
}

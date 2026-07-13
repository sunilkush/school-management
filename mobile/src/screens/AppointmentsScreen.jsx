import React from 'react';
import { CounselingSessionListView } from './counselor/CounselingSessionListView';

export function AppointmentsScreen() {
  return (
    <CounselingSessionListView
      type="Appointment"
      icon="calendar-check-outline"
      screenTitle="Appointments"
      issueLabel="Purpose"
      dateLabel="Appointment Date"
      completeLabel="Confirm"
      cancelLabel="Decline"
      createLabel="New Appointment"
      emptyLabel="No appointments yet"
    />
  );
}

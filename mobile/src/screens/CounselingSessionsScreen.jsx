import React from 'react';
import { CounselingSessionListView } from './counselor/CounselingSessionListView';

export function CounselingSessionsScreen() {
  return (
    <CounselingSessionListView
      type="Session"
      icon="calendar-clock-outline"
      screenTitle="Counseling Sessions"
      issueLabel="Issue"
      dateLabel="Session Date"
      completeLabel="Complete"
      cancelLabel="Cancel"
      createLabel="New Session"
      emptyLabel="No counseling sessions yet"
    />
  );
}

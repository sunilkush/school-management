import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, IconButton, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { PeriodEntrySheet } from './PeriodEntrySheet';
import { DAY_LABELS, DAY_ORDER, TEACHING_ENTRY_TYPES, timetableRowTitle, timetableTypeColor } from '../../utils/timetable';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import {
  useDeleteTimetableEntryMutation,
  useGetAllUsersQuery,
  useGetClassDetailsQuery,
  useGetClassSectionTimetableQuery,
  useGetSubjectsQuery,
  useGetTimeSlotsQuery,
  useGetTimetableRoomsQuery,
} from '../../store/api/apiSlice';

export function ScheduleTab() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [day, setDay] = useState('monday');
  const [editing, setEditing] = useState(null); // { entry } | { context: {day, timeSlot} }

  const { data: classes = [] } = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: teachers = [] } = useGetAllUsersQuery({ roleName: 'Teacher' });
  const { data: rooms = [] } = useGetTimetableRoomsQuery();
  const { data: timeSlots = [], isLoading: slotsLoading } = useGetTimeSlotsQuery({ academicYearId }, { skip: !academicYearId });

  const entriesQuery = useGetClassSectionTimetableQuery(
    { schoolClassId: classId, sectionId, academicYearId },
    { skip: !classId || !sectionId || !academicYearId }
  );
  const [deleteEntry, deleteState] = useDeleteTimetableEntryMutation();
  const entries = entriesQuery.data ?? [];

  const entriesForDay = useMemo(() => {
    const map = new Map();
    entries.filter((e) => e.dayOfWeek === day).forEach((e) => map.set(e.timeSlotId?._id, e));
    return map;
  }, [entries, day]);

  const selectClass = (id) => {
    setClassId(id);
    setSectionId(null);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        {classes.map((c) => (
          <Chip key={c._id} selected={c._id === classId} onPress={() => selectClass(c._id)}>
            {c.name}
          </Chip>
        ))}
      </ScrollView>

      {sections.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          {sections.map((s) => (
            <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id)}>
              {s.name}
            </Chip>
          ))}
        </ScrollView>
      )}

      {sectionId && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {DAY_ORDER.filter((d) => d !== 'sunday').map((d) => (
              <Chip key={d} selected={d === day} onPress={() => setDay(d)}>
                {DAY_LABELS[d]}
              </Chip>
            ))}
          </ScrollView>

          <QueryState
            isLoading={slotsLoading || entriesQuery.isLoading || entriesQuery.isFetching}
            isError={entriesQuery.isError}
            error={entriesQuery.error}
            onRetry={entriesQuery.refetch}
            isEmpty={timeSlots.length === 0}
            emptyIcon="clock-alert-outline"
            emptyLabel="Create time slots first (Time Slots tab) before building the schedule"
          >
            {timeSlots.map((slot) => {
              const entry = entriesForDay.get(slot._id);
              if (!entry) {
                return (
                  <AccentListCard
                    key={slot._id}
                    accent={colors.border}
                    avatar={<IconWell icon="plus" color={colors.textMuted} size={38} />}
                    title={slot.name}
                    subtitle={`${slot.startTime} – ${slot.endTime} · Empty`}
                    onPress={() => setEditing({ context: { day, timeSlot: slot } })}
                  />
                );
              }
              const color = timetableTypeColor(entry.type);
              return (
                <AccentListCard
                  key={slot._id}
                  accent={color}
                  avatar={<IconWell icon="book-open-variant" color={color} size={38} />}
                  title={timetableRowTitle(entry)}
                  subtitle={`${slot.startTime} – ${slot.endTime}${TEACHING_ENTRY_TYPES.has(entry.type) && entry.teacherId?.name ? ` · ${entry.teacherId.name}` : ''}${entry.roomId?.name ? ` · ${entry.roomId.name}` : ''}`}
                  actions={
                    <>
                      <IconButton icon="pencil-outline" size={18} onPress={() => setEditing({ entry })} />
                      <IconButton
                        icon="trash-can-outline"
                        iconColor={colors.danger}
                        size={18}
                        disabled={deleteState.isLoading}
                        onPress={() => confirmDelete(() => deleteEntry(entry._id), 'this period')}
                      />
                    </>
                  }
                />
              );
            })}
          </QueryState>
        </>
      )}

      {!sectionId && (
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' }]}>
          Select a class and section to view its schedule
        </Text>
      )}

      <PeriodEntrySheet
        visible={Boolean(editing)}
        entry={editing?.entry}
        context={editing?.context}
        onDismiss={() => setEditing(null)}
        onSaved={() => setEditing(null)}
        classId={classId}
        sectionId={sectionId}
        academicYearId={academicYearId}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
      />
    </View>
  );
}

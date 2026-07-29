import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetExamSeatPlanQuery, useGetExamsQuery } from '../../store/api/apiSlice';

/** Room/seat assignment for an exam — computed on the fly server-side (round-robin over the
 * enrolled roster in registrationNumber order), not persisted, so changing Room Capacity just
 * re-computes a new arrangement rather than editing a saved plan. */
export function SeatPlanView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const academicYearId = user?.academicYear?._id;
  const [examId, setExamId] = useState(null);
  const [roomCapacity, setRoomCapacity] = useState('30');

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];

  const seatPlanQuery = useGetExamSeatPlanQuery(
    { examId, roomCapacity: Number(roomCapacity) || 30 },
    { skip: !examId }
  );
  const seatPlan = seatPlanQuery.data?.seatPlan ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="seat-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Exam Seat Plan</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Room and seat assignment for an exam
          </Text>
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EXAM</Text>
      <QueryState
        isLoading={examsQuery.isLoading}
        isError={examsQuery.isError}
        error={examsQuery.error}
        onRetry={examsQuery.refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams available yet"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === examId} onPress={() => setExamId(e._id)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        {examId && (
          <>
            <FormField label="Room Capacity" value={roomCapacity} onChangeText={setRoomCapacity} keyboardType="numeric" style={{ marginBottom: spacing.md, maxWidth: 160 }} />

            <QueryState
              isLoading={seatPlanQuery.isLoading || seatPlanQuery.isFetching}
              isError={seatPlanQuery.isError}
              error={seatPlanQuery.error}
              onRetry={seatPlanQuery.refetch}
              isEmpty={seatPlan.length === 0}
              emptyIcon="view-grid-outline"
              emptyLabel="No students enrolled for this exam's class/section"
            >
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                {seatPlanQuery.data?.totalStudents ?? 0} students · {seatPlanQuery.data?.totalRooms ?? 0} room(s)
              </Text>
              {seatPlan.map((seat, i) => (
                <AccentListCard
                  key={`${seat.studentId}-${i}`}
                  accent={colors.primary}
                  avatar={<IconWell icon="seat-outline" color={colors.primary} size={38} />}
                  title={seat.studentName ?? 'Unknown Student'}
                  subtitle={`Roll No: ${seat.rollNumber ?? '—'}`}
                  meta={[
                    { label: 'Room', value: seat.roomNumber },
                    { label: 'Seat', value: seat.seatNumber },
                  ]}
                />
              ))}
            </QueryState>
          </>
        )}
      </QueryState>
    </ScreenContainer>
  );
}

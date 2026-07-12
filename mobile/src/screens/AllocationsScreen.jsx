import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusPill } from '../components/ui/StatusPill';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  useAssignStudentToRoomMutation,
  useGetHostelRoomsQuery,
  useGetStudentsBySchoolQuery,
  useRemoveStudentFromRoomMutation,
} from '../store/api/apiSlice';

/** Student-centric counterpart to Rooms — an unallocated student is invisible on the room-centric
 * Rooms page unless you scan every room; this indexes by student instead. Mirrors
 * frontend/src/pages/School_Admin/Hostel/HostelAllocations.jsx. Reuses the same assign/unassign
 * endpoints RoomDetailSheet.jsx already uses. */
export function AllocationsScreen() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [search, setSearch] = useState('');
  const [pickingRoomFor, setPickingRoomFor] = useState(null);
  const [error, setError] = useState(null);

  const studentsQuery = useGetStudentsBySchoolQuery({ search: search.trim() || undefined });
  const roomsQuery = useGetHostelRoomsQuery();
  const rooms = roomsQuery.data ?? [];
  const [assignStudent, assignState] = useAssignStudentToRoomMutation();
  const [removeStudent, removeState] = useRemoveStudentFromRoomMutation();

  const roomFor = (userId) => rooms.find((r) => r.students?.some((s) => s.studentId === userId));

  const students = useMemo(
    () =>
      (studentsQuery.data ?? []).map((row) => ({
        userId: row.user?._id,
        name: row.user?.name ?? 'Unknown',
        className: row.schoolClass?.name,
        sectionName: row.section?.name,
      })),
    [studentsQuery.data]
  );

  const allocatedCount = students.filter((s) => roomFor(s.userId)).length;

  const handleAssign = async (roomId) => {
    try {
      await assignStudent({ roomId, studentName: pickingRoomFor.name, studentId: pickingRoomFor.userId }).unwrap();
      setPickingRoomFor(null);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to allocate student');
    }
  };

  const handleRemove = (room, userId) => {
    const subdoc = room.students.find((s) => s.studentId === userId);
    if (subdoc) removeStudent({ roomId: room._id, studentId: subdoc._id });
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-group-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Allocations</Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Students" metric={{ label: 'Students', icon: 'account-group-outline', color: colors.primary, value: students.length }} />
          <StatCard label="Allocated" metric={{ label: 'Allocated', icon: 'door', color: '#22C55E', value: allocatedCount }} />
          <StatCard label="Unallocated" metric={{ label: 'Unallocated', icon: 'door-closed', color: '#F59E0B', value: students.length - allocatedCount }} />
        </StatGrid>
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by name or email" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={studentsQuery.isLoading || roomsQuery.isLoading}
        isError={studentsQuery.isError || roomsQuery.isError}
        error={studentsQuery.error || roomsQuery.error}
        onRetry={() => {
          studentsQuery.refetch();
          roomsQuery.refetch();
        }}
        isEmpty={students.length === 0}
        emptyIcon="account-off-outline"
        emptyLabel="No students found"
      >
        {students.map((s) => {
          const room = roomFor(s.userId);
          return (
            <AccentListCard
              key={s.userId}
              accent={room ? '#22C55E' : '#F59E0B'}
              avatar={<AvatarInitials name={s.name} size={40} />}
              title={s.name}
              subtitle={`${s.className ?? ''}${s.sectionName ? ` · ${s.sectionName}` : ''}`}
              badge={<StatusPill label={room ? `Room ${room.roomNumber}` : 'Unallocated'} color={room ? '#22C55E' : '#F59E0B'} />}
              actions={
                room ? (
                  <Button size="small" textColor={colors.danger} onPress={() => handleRemove(room, s.userId)} disabled={removeState.isLoading}>
                    Remove
                  </Button>
                ) : (
                  <Button size="small" mode="contained-tonal" onPress={() => setPickingRoomFor(s)}>
                    Allocate
                  </Button>
                )
              }
            />
          );
        })}
      </QueryState>

      <Portal>
        <Modal
          visible={!!pickingRoomFor}
          onDismiss={() => setPickingRoomFor(null)}
          contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '75%' }}
        >
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            Allocate {pickingRoomFor?.name}
          </Text>
          <ScrollView>
            {rooms.map((r) => {
              const full = (r.students?.length ?? 0) >= r.capacity;
              return (
                <AccentListCard
                  key={r._id}
                  accent={full ? '#EF4444' : '#22C55E'}
                  avatar={<IconWell icon="door" color={colors.primary} size={36} />}
                  title={`Room ${r.roomNumber}`}
                  subtitle={`${r.students?.length ?? 0}/${r.capacity} occupied`}
                  actions={
                    <Button size="small" mode="contained" disabled={full || assignState.isLoading} onPress={() => handleAssign(r._id)}>
                      {full ? 'Full' : 'Assign'}
                    </Button>
                  }
                />
              );
            })}
          </ScrollView>
          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}
          <Button mode="outlined" onPress={() => setPickingRoomFor(null)} style={{ marginTop: spacing.md }}>
            Cancel
          </Button>
        </Modal>
      </Portal>
    </ScreenContainer>
  );
}

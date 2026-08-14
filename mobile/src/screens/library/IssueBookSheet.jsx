import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, List, Modal, Portal, Text } from 'react-native-paper';
import { SearchField } from '../../components/ui/SearchField';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetAllUsersQuery,
  useGetBooksQuery,
  useGetStudentsListQuery,
  useIssueBookToStudentMutation,
} from '../../store/api/apiSlice';

const BORROWER_TYPES = [
  { key: 'Student', label: 'Student' },
  { key: 'Staff', label: 'Staff' },
];

/** Book borrower can be either a Student (studentId, memberType 'Student') or a staff member
 * (issuedToUserId, memberType 'Teacher' — the backend only distinguishes Teacher-vs-everything-
 * else for the default return window, so 'Teacher' is sent for any staff borrower, not just
 * actual teachers). Reuses the same GET /student/all search the Accountant fee-collection flow
 * already built, and GET /user/all (TeachersScreen's "Staff Directory" query) for staff search. */
export function IssueBookSheet({ visible, onDismiss, onIssued }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [issueBook, issueState] = useIssueBookToStudentMutation();

  const [borrowerType, setBorrowerType] = useState('Student');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [error, setError] = useState(null);

  const studentsQuery = useGetStudentsListQuery({ page: 1, limit: 20 }, { skip: !studentSearch.trim() });
  const students = (studentsQuery.data?.students ?? []).filter((s) =>
    s.studentName?.toLowerCase().includes(studentSearch.trim().toLowerCase())
  );

  // Not filtered by role — any active non-student staff member (Teacher, Librarian, Accountant,
  // etc.) can borrow a book; memberType only ever needs to be 'Teacher' vs the student default.
  const staffQuery = useGetAllUsersQuery({}, { skip: !staffSearch.trim() });
  const staff = (staffQuery.data ?? []).filter(
    (u) => u.role?.name !== 'Student' && u.name?.toLowerCase().includes(staffSearch.trim().toLowerCase())
  );

  const { data: books = [] } = useGetBooksQuery();
  const availableBooks = useMemo(() => books.filter((b) => b.availableCopies > 0), [books]);

  const reset = () => {
    setBorrowerType('Student');
    setStudentSearch('');
    setSelectedStudent(null);
    setStaffSearch('');
    setSelectedStaff(null);
    setSelectedBookId(null);
    setError(null);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  const handleIssue = async () => {
    const borrower = borrowerType === 'Student' ? selectedStudent : selectedStaff;
    if (!borrower || !selectedBookId) {
      setError(`Select a ${borrowerType.toLowerCase()} and a book`);
      return;
    }
    try {
      const payload = borrowerType === 'Student'
        ? { bookId: selectedBookId, studentId: selectedStudent.studentId, memberType: 'Student' }
        : { bookId: selectedBookId, issuedToUserId: selectedStaff._id, memberType: 'Teacher' };
      await issueBook(payload).unwrap();
      reset();
      onIssued?.();
    } catch (err) {
      setError(err?.message || 'Failed to issue book');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={handleDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Issue Book</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>BORROWER</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {BORROWER_TYPES.map((t) => (
              <Chip
                key={t.key}
                selected={t.key === borrowerType}
                onPress={() => { setBorrowerType(t.key); setError(null); }}
              >
                {t.label}
              </Chip>
            ))}
          </View>

          {borrowerType === 'Student' ? (
            selectedStudent ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{selectedStudent.studentName}</Text>
                <Button mode="text" compact onPress={() => setSelectedStudent(null)}>
                  Change
                </Button>
              </View>
            ) : (
              <View>
                <SearchField value={studentSearch} onChangeText={setStudentSearch} placeholder="Search student by name" style={{ marginBottom: spacing.sm }} />
                {students.slice(0, 6).map((s) => (
                  <List.Item
                    key={s._id}
                    title={s.studentName}
                    description={s.className}
                    onPress={() => s.studentId && setSelectedStudent(s)}
                  />
                ))}
              </View>
            )
          ) : (
            selectedStaff ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{selectedStaff.name}</Text>
                <Button mode="text" compact onPress={() => setSelectedStaff(null)}>
                  Change
                </Button>
              </View>
            ) : (
              <View>
                <SearchField value={staffSearch} onChangeText={setStaffSearch} placeholder="Search staff by name" style={{ marginBottom: spacing.sm }} />
                {staff.slice(0, 6).map((u) => (
                  <List.Item
                    key={u._id}
                    title={u.name}
                    description={u.role?.name}
                    onPress={() => setSelectedStaff(u)}
                  />
                ))}
              </View>
            )
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>BOOK</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {availableBooks.map((b) => (
              <Chip key={b._id} selected={b._id === selectedBookId} onPress={() => setSelectedBookId(b._id)}>
                {b.title} ({b.availableCopies})
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={handleDismiss} style={{ flex: 1 }} disabled={issueState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleIssue} loading={issueState.isLoading} disabled={issueState.isLoading} style={{ flex: 1 }}>
              Issue
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

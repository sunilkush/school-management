import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, List, Modal, Portal, Text } from 'react-native-paper';
import { SearchField } from '../../components/ui/SearchField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetBooksQuery, useGetStudentsListQuery, useIssueBookToStudentMutation } from '../../store/api/apiSlice';

/** Issuing to staff (issuedToUserId, memberType 'Teacher') is deferred — this covers the dominant
 * workflow, issuing to a Student, reusing the same GET /student/all search already built for the
 * Accountant fee-collection flow. */
export function IssueBookSheet({ visible, onDismiss, onIssued }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [issueBook, issueState] = useIssueBookToStudentMutation();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [error, setError] = useState(null);

  const studentsQuery = useGetStudentsListQuery({ page: 1, limit: 20 }, { skip: !studentSearch.trim() });
  const students = (studentsQuery.data?.students ?? []).filter((s) =>
    s.studentName?.toLowerCase().includes(studentSearch.trim().toLowerCase())
  );

  const { data: books = [] } = useGetBooksQuery();
  const availableBooks = useMemo(() => books.filter((b) => b.availableCopies > 0), [books]);

  const reset = () => {
    setStudentSearch('');
    setSelectedStudent(null);
    setSelectedBookId(null);
    setError(null);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  const handleIssue = async () => {
    if (!selectedStudent || !selectedBookId) {
      setError('Select a student and a book');
      return;
    }
    try {
      await issueBook({ bookId: selectedBookId, studentId: selectedStudent.studentId, memberType: 'Student' }).unwrap();
      reset();
      onIssued?.();
    } catch (err) {
      setError(err?.message || 'Failed to issue book');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Issue Book</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STUDENT</Text>
          {selectedStudent ? (
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

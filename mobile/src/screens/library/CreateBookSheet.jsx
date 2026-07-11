import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateBookMutation } from '../../store/api/apiSlice';

export function CreateBookSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createBook, createState] = useCreateBookMutation();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setAuthor('');
      setPublisher('');
      setCategory('');
      setIsbn('');
      setShelfLocation('');
      setTotalCopies('1');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim() || !author.trim() || !publisher.trim() || !category.trim() || !shelfLocation.trim()) {
      setError('Title, author, publisher, category and shelf location are all required');
      return;
    }

    try {
      await createBook({
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        category: category.trim(),
        isbn: isbn.trim() || undefined,
        shelfLocation: shelfLocation.trim(),
        totalCopies: Number(totalCopies) || 1,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save book');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Book</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Author" value={author} onChangeText={setAuthor} disabled={createState.isLoading} />
          <FormField label="Publisher" value={publisher} onChangeText={setPublisher} disabled={createState.isLoading} />
          <FormField label="Category" value={category} onChangeText={setCategory} disabled={createState.isLoading} />
          <FormField label="ISBN (optional)" value={isbn} onChangeText={setIsbn} disabled={createState.isLoading} />
          <FormField label="Shelf Location" value={shelfLocation} onChangeText={setShelfLocation} disabled={createState.isLoading} />
          <FormField label="Total Copies" value={totalCopies} onChangeText={setTotalCopies} keyboardType="numeric" disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

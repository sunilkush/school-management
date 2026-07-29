import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateBookMutation, useUpdateBookMutation } from '../../store/api/apiSlice';

export function CreateBookSheet({ visible, onDismiss, onCreated, book }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createBook, createState] = useCreateBookMutation();
  const [updateBook, updateState] = useUpdateBookMutation();
  const isEditing = Boolean(book);
  const saveState = isEditing ? updateState : createState;

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
      setTitle(book?.title ?? '');
      setAuthor(book?.author ?? '');
      setPublisher(book?.publisher ?? '');
      setCategory(book?.category ?? '');
      setIsbn(book?.isbn ?? '');
      setShelfLocation(book?.shelfLocation ?? '');
      setTotalCopies(String(book?.totalCopies ?? 1));
      setError(null);
    }
  }, [visible, book]);

  const handleSave = async () => {
    if (!title.trim() || !author.trim() || !publisher.trim() || !category.trim() || !shelfLocation.trim()) {
      setError('Title, author, publisher, category and shelf location are all required');
      return;
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      category: category.trim(),
      isbn: isbn.trim() || undefined,
      shelfLocation: shelfLocation.trim(),
      totalCopies: Number(totalCopies) || 1,
    };

    try {
      if (isEditing) {
        await updateBook({ id: book._id, ...payload }).unwrap();
      } else {
        await createBook(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to save book');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Book' : 'New Book'}</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={saveState.isLoading} />
          <FormField label="Author" value={author} onChangeText={setAuthor} disabled={saveState.isLoading} />
          <FormField label="Publisher" value={publisher} onChangeText={setPublisher} disabled={saveState.isLoading} />
          <FormField label="Category" value={category} onChangeText={setCategory} disabled={saveState.isLoading} />
          <FormField label="ISBN (optional)" value={isbn} onChangeText={setIsbn} disabled={saveState.isLoading} />
          <FormField label="Shelf Location" value={shelfLocation} onChangeText={setShelfLocation} disabled={saveState.isLoading} />
          <FormField label="Total Copies" value={totalCopies} onChangeText={setTotalCopies} keyboardType="numeric" disabled={saveState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

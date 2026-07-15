import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { CreateBookSheet } from './library/CreateBookSheet';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteBookMutation, useGetBooksQuery } from '../store/api/apiSlice';

// backend/src/routes/book.routes.js LIBRARY_STAFF — create/update allows School Admin/Teacher/
// Librarian; delete only School Admin/Librarian. Principal (via the Library nav key reusing this
// screen) gets neither, so it's a genuinely read-only browse for that role instead of buttons that
// would 403.
const CAN_CREATE_ROLES = new Set(['School Admin', 'Teacher', 'Librarian']);
const CAN_DELETE_ROLES = new Set(['School Admin', 'Librarian']);

/** Mirrors frontend/src/pages/School_Admin/Library/Books.jsx. Editing an existing book is
 * deferred (create + delete covers the core catalog workflow). */
export function BooksScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const canCreate = CAN_CREATE_ROLES.has(role?.name);
  const canDelete = CAN_DELETE_ROLES.has(role?.name);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetBooksQuery();
  const [deleteBook, deleteState] = useDeleteBookMutation();
  const books = data ?? [];

  const categories = useMemo(() => [...new Set(books.map((b) => b.category).filter(Boolean))], [books]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books.filter((b) => {
      const matchesSearch = !query || [b.title, b.author, b.isbn].some((f) => f?.toLowerCase?.().includes(query));
      const matchesCategory = !selectedCategory || b.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, search, selectedCategory]);

  const stats = [
    { key: 'total', label: 'Total Books', icon: 'book-multiple-outline', color: colors.primary, value: books.length },
    { key: 'available', label: 'Available', icon: 'book-check-outline', color: '#22C55E', value: books.reduce((sum, b) => sum + (b.availableCopies || 0), 0) },
    { key: 'issued', label: 'Issued', icon: 'book-arrow-right-outline', color: '#F59E0B', value: books.reduce((sum, b) => sum + Math.max((b.totalCopies || 0) - (b.availableCopies || 0), 0), 0) },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="book-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Book Catalog</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Library book inventory
          </Text>
        </View>
      </View>

      {canCreate && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
          <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
            Add Book
          </Button>
        </View>
      )}

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      {categories.length > 0 && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
          <Chip selected={!selectedCategory} onPress={() => setSelectedCategory(null)}>
            All Categories
          </Chip>
          {categories.map((c) => (
            <Chip key={c} selected={c === selectedCategory} onPress={() => setSelectedCategory(c)}>
              {c}
            </Chip>
          ))}
        </View>
      )}

      <SearchField value={search} onChangeText={setSearch} placeholder="Search by title, author or ISBN" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="book-remove-outline"
        emptyLabel={search || selectedCategory ? 'No books match your filters' : 'No books in the catalog yet'}
      >
        {filtered.map((b) => (
          <AccentListCard
            key={b._id}
            accent={b.availableCopies > 0 ? '#22C55E' : '#EF4444'}
            avatar={<IconWell icon="book-outline" color={colors.primary} size={38} />}
            title={b.title}
            subtitle={`${b.author} · ${b.publisher}`}
            badge={
              <Text style={[typography.caption, { color: b.availableCopies > 0 ? '#22C55E' : '#EF4444', fontWeight: '700' }]}>
                {b.availableCopies}/{b.totalCopies} available
              </Text>
            }
            meta={[
              { label: 'Category', value: b.category },
              { label: 'ISBN', value: b.isbn },
              { label: 'Shelf', value: b.shelfLocation },
              { label: 'Language', value: b.language },
            ]}
            expandable
            actions={
              !canCreate && !canDelete ? undefined : (
                <>
                  {canCreate && <IconButton icon="pencil-outline" size={18} onPress={() => setEditingBook(b)} />}
                  {canDelete && (
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={colors.danger}
                      size={18}
                      disabled={deleteState.isLoading}
                      onPress={() => deleteBook(b._id)}
                    />
                  )}
                </>
              )
            }
          />
        ))}
      </QueryState>

      <CreateBookSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <CreateBookSheet visible={!!editingBook} book={editingBook} onDismiss={() => setEditingBook(null)} onCreated={() => setEditingBook(null)} />
    </ScreenContainer>
  );
}

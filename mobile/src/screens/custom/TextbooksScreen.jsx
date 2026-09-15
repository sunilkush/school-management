import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Icon, Text, TouchableRipple } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetTextbookQuery, useGetTextbooksQuery } from '../../store/api/apiSlice';

const titleCase = (s = '') => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Textbooks class-wise and subject-wise; tapping a chapter opens its PDF.
 *
 * The PDFs are NCERT's own on ncert.nic.in, opened in the phone's browser or PDF viewer — they are
 * not copied into the app (backend/src/models/Textbook.model.js). One book is open at a time, so
 * only one book's chapter list is ever fetched.
 */
export function TextbooksScreen() {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [classNo, setClassNo] = useState(10);
  const [subjectId, setSubjectId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const list = useGetTextbooksQuery({ classNo });
  const books = Array.isArray(list.data) ? list.data : [];
  const book = useGetTextbookQuery(openId, { skip: !openId });

  const subjects = useMemo(() => {
    const map = new Map();
    for (const b of books) {
      const id = b.subjectId?._id;
      if (id && !map.has(id)) map.set(id, { id, name: titleCase(b.subjectId.name) });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [books]);
  const shown = subjectId ? books.filter((b) => b.subjectId?._id === subjectId) : books;

  const pickClass = (n) => { setClassNo(n); setSubjectId(null); setOpenId(null); };
  const open = (url) => { if (url) Linking.openURL(url).catch(() => {}); };

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <Chip key={n} selected={n === classNo} showSelectedCheck={false} onPress={() => pickClass(n)} compact>
              {`Class ${n}`}
            </Chip>
          ))}
        </View>
      </ScrollView>

      <QueryState isLoading={list.isLoading} isError={list.isError} error={list.error} onRetry={list.refetch} isEmpty={!books.length} emptyLabel={`No textbooks for Class ${classNo} yet`}>
        <>
          {subjects.length > 1 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
              <Chip selected={!subjectId} showSelectedCheck={false} onPress={() => setSubjectId(null)} compact>All</Chip>
              {subjects.map((s) => (
                <Chip key={s.id} selected={subjectId === s.id} showSelectedCheck={false} onPress={() => setSubjectId(subjectId === s.id ? null : s.id)} compact>
                  {s.name}
                </Chip>
              ))}
            </View>
          ) : null}

          {shown.map((b) => {
            const isOpen = openId === b._id;
            const chapters = isOpen ? book.data?.chapters ?? [] : [];
            return (
              <Panel key={b._id} style={{ padding: 0, overflow: 'hidden' }}>
                <TouchableRipple onPress={() => setOpenId(isOpen ? null : b._id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
                    <Icon source="book-open-variant" size={26} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyStrong, { color: colors.text }]}>{b.title}</Text>
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
                        {titleCase(b.subjectId?.name)} · {b.chapterCount} chapters
                      </Text>
                    </View>
                    <Icon source={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
                  </View>
                </TouchableRipple>

                {isOpen ? (
                  <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderTopWidth: 1, borderColor: colors.border }}>
                    {book.isFetching && !chapters.length ? (
                      <ActivityIndicator style={{ marginVertical: spacing.md }} />
                    ) : book.isError ? (
                      <Text style={[typography.caption, { color: colors.danger, marginVertical: spacing.md }]}>Could not load the chapters.</Text>
                    ) : (
                      chapters.map((c) => (
                        <TouchableRipple key={c.bookChapterNo} onPress={() => open(c.pdfUrl)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
                            <Text style={[typography.caption, { color: colors.primary, minWidth: 24, textAlign: 'center', borderRadius: radii.sm }]}>
                              {c.bookChapterNo}
                            </Text>
                            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{c.name}</Text>
                            <Icon source="file-pdf-box" size={22} color={colors.danger} />
                          </View>
                        </TouchableRipple>
                      ))
                    )}
                    {b.bookUrl ? (
                      <Button mode="text" icon="download" onPress={() => open(b.bookUrl)} style={{ alignSelf: 'flex-start' }}>
                        Full book (ZIP)
                      </Button>
                    ) : null}
                  </View>
                ) : null}
              </Panel>
            );
          })}

          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            Books and PDFs © NCERT, opened from ncert.nic.in.
          </Text>
        </>
      </QueryState>
    </ScreenContainer>
  );
}

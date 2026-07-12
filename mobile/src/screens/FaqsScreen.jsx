import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, List, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { CreateFaqSheet } from './superAdmin/CreateFaqSheet';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useDeleteFaqMutation, useGetFaqsQuery } from '../store/api/apiSlice';

const CATEGORIES = [null, 'general', 'billing', 'technical', 'academic', 'other'];

/** FAQ list — read is open to any role; create/edit/delete are Super Admin only. */
export function FaqsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const canManage = role?.name === 'Super Admin';
  const [category, setCategory] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetFaqsQuery();
  const faqs = useMemo(() => (category ? (data ?? []).filter((f) => f.category === category) : data ?? []), [data, category]);
  const [deleteFaq] = useDeleteFaqMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="comment-question-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>FAQs</Text>
        </View>
      </View>

      {canManage && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
          <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
            New FAQ
          </Button>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
        {CATEGORIES.map((c) => (
          <Chip key={c || 'all'} selected={category === c} onPress={() => setCategory(c)}>
            {c ?? 'All'}
          </Chip>
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={faqs.length === 0}
        emptyIcon="comment-question-outline"
        emptyLabel="No FAQs yet"
      >
        <List.AccordionGroup>
          {faqs.map((f) => (
            <List.Accordion
              key={f._id}
              id={f._id}
              title={f.question}
              description={f.category}
              left={(props) => <List.Icon {...props} icon="help-circle-outline" />}
              style={{ backgroundColor: colors.surface, marginBottom: spacing.sm, borderRadius: 12 }}
            >
              <Text style={[typography.body, { color: colors.textSecondary, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
                {f.answer}
              </Text>
              {canManage && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
                  <IconButton icon="pencil-outline" size={18} onPress={() => setEditingFaq(f)} />
                  <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={() => deleteFaq(f._id)} />
                </View>
              )}
            </List.Accordion>
          ))}
        </List.AccordionGroup>
      </QueryState>

      {canManage && (
        <>
          <CreateFaqSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
          <CreateFaqSheet visible={!!editingFaq} faq={editingFaq} onDismiss={() => setEditingFaq(null)} onCreated={() => setEditingFaq(null)} />
        </>
      )}
    </ScreenContainer>
  );
}

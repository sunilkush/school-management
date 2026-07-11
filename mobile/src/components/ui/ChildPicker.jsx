import React from 'react';
import { ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Horizontal child-switcher for Parent screens. `children` items come from GET /student/my-children. */
export function ChildPicker({ children, selectedId, onSelect }) {
  const { spacing } = useAppTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
      {children.map((child) => (
        <Chip
          key={child._id}
          selected={child._id === selectedId}
          onPress={() => onSelect(child)}
          mode={child._id === selectedId ? 'flat' : 'outlined'}
        >
          {child.name}
        </Chip>
      ))}
    </ScrollView>
  );
}

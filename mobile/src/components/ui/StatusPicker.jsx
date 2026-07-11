import React, { useState } from 'react';
import { Chip, Menu } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { ATTENDANCE_STATUSES, STATUS_META } from '../../utils/attendance';

/** Tap-to-open menu chip for picking one of the 5 attendance statuses on a roster row. */
export function StatusPicker({ value, onChange }) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const meta = STATUS_META[value];
  const tint = meta?.color ?? colors.textMuted;

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Chip
          icon={meta?.icon}
          onPress={() => setVisible(true)}
          style={{ backgroundColor: `${tint}22` }}
          textStyle={{ color: tint }}
        >
          {meta?.label ?? value}
        </Chip>
      }
    >
      {ATTENDANCE_STATUSES.map((status) => (
        <Menu.Item
          key={status}
          title={STATUS_META[status].label}
          leadingIcon={STATUS_META[status].icon}
          onPress={() => {
            onChange(status);
            setVisible(false);
          }}
        />
      ))}
    </Menu>
  );
}

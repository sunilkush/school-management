import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { pillStyle } from '../../theme/patterns';
import { AccentListCard } from '../ui/AccentListCard';
import { AvatarInitials } from '../ui/AvatarInitials';
import { PERFORMANCE_META } from '../../utils/performance';

/** Top-5 teacher performance card list — mirrors the web dashboard's `EmployeePerformance.jsx`
 * mobile branch (already card-based there via antd's `useBreakpoint`), not its desktop table. */
export function EmployeePerformanceList({ data = [] }) {
  const { colors, typography } = useAppTheme();

  return (
    <View>
      {data.map((employee) => {
        const perf = PERFORMANCE_META[employee.performance] ?? PERFORMANCE_META.AVERAGE;
        return (
          <AccentListCard
            key={employee.email + employee.name}
            accent={perf.color}
            avatar={<AvatarInitials name={employee.name} size={40} />}
            title={employee.name}
            subtitle={employee.email}
            badge={
              <View style={pillStyle(perf.color)}>
                <Text style={[typography.caption, { color: perf.color, fontWeight: '700' }]}>{perf.label}</Text>
              </View>
            }
            meta={[
              { label: 'Department', value: employee.dept },
              { label: 'Designation', value: employee.designation },
              { label: 'Score', value: `${employee.score}%` },
            ]}
          />
        );
      })}
    </View>
  );
}

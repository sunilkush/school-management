import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateFeeStructureSheet } from './CreateFeeStructureSheet';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import { useDeleteFeeStructureMutation, useGetClassDetailsQuery, useGetFeeStructuresQuery } from '../../store/api/apiSlice';

const FREQUENCY_COLOR = { monthly: '#2563EB', quarterly: '#F59E0B', yearly: '#22C55E' };

/** Links a Fee Head to a class + academic year with an amount/frequency — mirrors
 * frontend/src/pages/School_Admin/Fees_Management/FeeStructure.jsx. */
export function FeeStructuresView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;
  const [creating, setCreating] = useState(false);

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetFeeStructuresQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const structures = data ?? [];
  const [deleteFeeStructure, deleteState] = useDeleteFeeStructureMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Fee Structure
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={structures.length === 0}
        emptyIcon="file-table-outline"
        emptyLabel="No fee structures yet"
      >
        {structures.map((fs) => (
          <AccentListCard
            key={fs._id}
            accent={FREQUENCY_COLOR[fs.frequency] || colors.primary}
            avatar={<IconWell icon="file-table-outline" color={FREQUENCY_COLOR[fs.frequency] || colors.primary} size={40} />}
            title={fs.feeHeadId?.name ?? 'Fee'}
            subtitle={fs.schoolClassId?.name ?? ''}
            badge={<StatusPill label={fs.frequency} color={FREQUENCY_COLOR[fs.frequency] || colors.textMuted} />}
            meta={[{ label: 'Amount', value: formatCurrency(fs.amount) }]}
            actions={
              <IconButton
                icon="trash-can-outline"
                iconColor={colors.danger}
                size={18}
                disabled={deleteState.isLoading}
                onPress={() => confirmDelete(() => deleteFeeStructure(fs._id), 'this fee structure')}
              />
            }
          />
        ))}
      </QueryState>

      <CreateFeeStructureSheet
        visible={creating}
        onDismiss={() => setCreating(false)}
        onCreated={() => setCreating(false)}
        classes={classes}
        schoolId={schoolId}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}

import React from 'react';
import { FinanceLedgerView } from './finance/FinanceLedgerView';
import { EXPENSE_CATEGORIES, EXPENSE_STATUS_META } from '../utils/finance';
import { useGetExpenseRecordsQuery, useCreateExpenseRecordMutation, useDeleteExpenseRecordMutation } from '../store/api/apiSlice';

/** Mirrors frontend/src/pages/Accountant/Finance/ExpenseManagement.jsx. */
export function ExpensesScreen() {
  return (
    <FinanceLedgerView
      title="Expenses"
      subtitle="Track expense records for this school"
      icon="cash-minus"
      accentColor="#EF4444"
      categories={EXPENSE_CATEGORIES}
      extraFieldLabel="Paid To"
      extraFieldKey="paidTo"
      statusMeta={EXPENSE_STATUS_META}
      useRecordsQuery={useGetExpenseRecordsQuery}
      useCreateMutation={useCreateExpenseRecordMutation}
      useDeleteMutation={useDeleteExpenseRecordMutation}
    />
  );
}

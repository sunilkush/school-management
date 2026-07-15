import React from 'react';
import { FinanceLedgerView } from './finance/FinanceLedgerView';
import { INCOME_CATEGORIES } from '../utils/finance';
import { useGetIncomeRecordsQuery, useCreateIncomeRecordMutation, useDeleteIncomeRecordMutation } from '../store/api/apiSlice';

/** Mirrors frontend/src/pages/Accountant/Finance/IncomeManagement.jsx. Income.model.js has no
 * status field (only category/paymentMode), unlike Expenses — statusMeta is omitted since
 * FinanceLedgerView's prop is optional. */
export function IncomeScreen() {
  return (
    <FinanceLedgerView
      title="Income"
      subtitle="Track income records for this school"
      icon="cash-plus"
      accentColor="#22C55E"
      categories={INCOME_CATEGORIES}
      extraFieldLabel="Received From"
      extraFieldKey="receivedFrom"
      useRecordsQuery={useGetIncomeRecordsQuery}
      useCreateMutation={useCreateIncomeRecordMutation}
      useDeleteMutation={useDeleteIncomeRecordMutation}
    />
  );
}

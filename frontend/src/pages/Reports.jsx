import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchReports } from '../features/reports/reportSlice';
import ReportFilters from './ReportFilters';
import ReportsTable from './ReportTable';
import CreateReportForm from './CreateReportForm';

const ReportsPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Super Admin Reports</h1>
      <CreateReportForm />
      <ReportFilters />
      <ReportsTable />
    </div>
  );
};

export default ReportsPage;
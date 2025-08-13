// src/pages/ReportsPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchReports } from "../features/reports/reportSlice";
import ReportFilters from "./ReportFilters";
import ReportsTable from "./ReportTable";
import SummaryCards from "./SummaryCards";
import ReportsChart from "./ReportsChart";
import ExportButtons from "./ExportButtons";
import CreateReportForm from "./CreateReportForm";

const ReportsPage = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    school: "",
    academicYear: "",
    reportType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  useEffect(() => {
    dispatch(fetchReports(filters));
  }, [dispatch, filters]);

  return (
    <div className="p-6 space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold">Super Admin Reports</h1>

      {/* Create Report Form */}
      <CreateReportForm />

      {/* Filters Panel */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <ReportFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalStudents={200}
        feesCollected={150000}
        presentPercent={92}
      />

      {/* Charts Section */}
      <div >
        <ReportsChart />
      </div>

      {/* Export Buttons */}
      <ExportButtons />

      {/* Report Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <ReportsTable filters={filters} />
      </div>
    </div>
  );
};

export default ReportsPage;

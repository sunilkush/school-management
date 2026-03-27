import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports } from "../../../features/reportSlice";
import ReportFilters from "./components/ReportFilters";
import ReportsTable from "./components/ReportTable";
import SummaryCards from "./components/SummaryCards";
import ReportsChart from "./components/ReportsChart";
import ExportButtons from "./components/ExportButtons";
import CreateReportForm from "./components/CreateReportForm";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";
import memoryStorage from "../../../utils/memoryStorage";

const Reports = () => {
  const dispatch = useDispatch();
  const { summary } = useSelector((state) => state.dashboard);
  
  const [filters, setFilters] = useState({
    school: "",
    academicYear: "",
    reportType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  // ✅ Correctly parse role from memoryStorage
  const storedUser = memoryStorage.getItem("user");
  let parsedRole;
  
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      parsedRole = userObj?.role?.name;
      
    } catch (e) {
      console.error("Invalid user object in memoryStorage", e);
    }
  }
  
  

  useEffect(() => {
  if (parsedRole) {
    dispatch(fetchDashboardSummary({
      role: parsedRole, 
     
    }));
  }
}, [dispatch, parsedRole]);

  useEffect(() => {
    dispatch(fetchReports(filters));
  }, [dispatch, filters]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{parsedRole} Reports</h1>

      <CreateReportForm />

      <div className="bg-white p-4 rounded-lg shadow-md">
        <ReportFilters filters={filters} setFilters={setFilters} />
      </div>

      <SummaryCards data={summary} />

      <ReportsChart />

      <ExportButtons />

      <div className="bg-white p-4 rounded-lg shadow-md">
        <ReportsTable filters={filters} />
      </div>
    </div>
  );
};

export default Reports;

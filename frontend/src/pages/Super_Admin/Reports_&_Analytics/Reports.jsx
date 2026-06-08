import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { fetchReports } from "../../../features/reportSlice";
import ReportFilters from "./components/ReportFilters";
import ReportsTable from "./components/ReportTable";
import SummaryCards from "./components/SummaryCards";
import ReportsChart from "./components/ReportsChart";
import ExportButtons from "./components/ExportButtons";
import CreateReportForm from "./components/CreateReportForm";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";


const Reports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { summary } = useSelector((state) => state.dashboard);
  
  const [filters, setFilters] = useState({
    school: "",
    academicYear: "",
    reportType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });
  const { user } = useSelector((state) => state.auth) || {};
  const parsedRole = useMemo(() => {
    const role = user?.role;

    if (typeof role === "string") return role;
    if (typeof role?.name === "string") return role.name;
    if (typeof user?.roleId?.name === "string") return user.roleId.name;

    return "User";
  }, [user]);


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
       <Space wrap>
        <Button type="primary" onClick={() => navigate("/dashboard/superadmin/reports/usage")}>
          Platform Usage
        </Button>
        <Button onClick={() => navigate("/dashboard/superadmin/reports/revenue")}>
          Revenue Analytics
        </Button>
      </Space>
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

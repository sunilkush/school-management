import { Card, Col, Row, Statistic } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPayrollDashboard } from "../../../features/payrollEnterpriseSlice";

export default function PayrollDashboardEnterprise() {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((s) => s.payrollEnterprise);
  useEffect(() => { dispatch(fetchPayrollDashboard()); }, [dispatch]);
  return <Row gutter={16}><Col span={8}><Card><Statistic title="Total Payout" value={dashboard?.totalPayout || 0} /></Card></Col><Col span={8}><Card><Statistic title="Employees Processed" value={dashboard?.employeesProcessed || 0} /></Card></Col><Col span={8}><Card><Statistic title="Payroll Runs" value={dashboard?.totalRuns || 0} /></Card></Col></Row>;
}

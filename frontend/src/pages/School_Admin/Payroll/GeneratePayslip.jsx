import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Empty, Row, Space, Table, message } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import { usePayrollCycle, usePayslip } from "../../../hooks/payrollHooks";
import PayslipFilters from "../../../components/payroll/PayslipFilters";
import PayslipPreview from "../../../components/payroll/PayslipPreview";
import { formatCurrencyINR } from "../../../utils/payroll";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  tableHeadCss,
} from "../../../styles/pageStyles";

const GeneratePayslip = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState();

  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { entries, loading, isCycleMissing, refreshCycle } = usePayrollCycle(month, year);
  const { loading: payslipLoading, payslip, notFound, fetchPayslip, clearPayslip } = usePayslip({
    month,
    year,
    employeeId: selectedEmployeeId,
  });

  useEffect(() => {
    httpClient
      .get("/employee")
      .then((res) => setEmployees(res?.data?.data || []))
      .catch(() => message.error("Employees load failed"));
  }, []);

  useEffect(() => {
    clearPayslip();
  }, [month, year, selectedEmployeeId, clearPayslip]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee._id,
        label: `${employee.userId?.name || "Employee"} (${employee.designation || "Staff"})`,
      })),
    [employees]
  );

  const entriesColumns = [
    { title: "Employee", render: (_, r) => r.employeeId?.userId?.name || "-" },
    { title: "Net Pay", dataIndex: "netPay", render: (v) => formatCurrencyINR(v) },
    { title: "Status", dataIndex: "paymentStatus" },
    {
      title: "Action",
      render: (_, r) => (
        <Button
          onClick={() => {
            const id = r.employeeId?._id;
            setSelectedEmployeeId(id);
            fetchPayslip(id);
          }}
        >
          Preview
        </Button>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("payslip-tbl")}</style>
      <PageHeader
        title="Payslip Center"
        subtitle="Generate and preview employee payslips"
        icon={<FileTextOutlined />}
      />

      <div style={{ padding: "20px" }}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <PayslipFilters
            monthValue={selectedMonth}
            onMonthChange={(v) => v && setSelectedMonth(v)}
            employeeOptions={employeeOptions}
            employeeId={selectedEmployeeId}
            setEmployeeId={setSelectedEmployeeId}
            onRefresh={refreshCycle}
            onFetch={() => fetchPayslip()}
            onPrint={() => window.print()}
            loading={payslipLoading}
          />
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div style={{ ...pageCard, padding: 24, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 16 }}>
                Cycle Entries — {selectedMonth.format("MMMM YYYY")}
              </div>
              {isCycleMissing ? (
                <Alert type="info" showIcon message="Cycle not found" description="Generate cycle first for this month." />
              ) : entries.length ? (
                <Table
                  className="payslip-tbl"
                  rowKey="_id"
                  columns={entriesColumns}
                  dataSource={entries}
                  loading={loading}
                  pagination={{ pageSize: 6 }}
                  scroll={{ x: "max-content" }}
                />
              ) : (
                <Empty description="No payroll entries" />
              )}
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div style={{ ...pageCard, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>Payslip Preview</div>
              {notFound && (
                <Alert type="warning" message="Payslip not found for selected employee/month" showIcon style={{ marginBottom: 12 }} />
              )}
              <PayslipPreview payslip={payslip} monthLabel={selectedMonth.format("MMMM YYYY")} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default GeneratePayslip;

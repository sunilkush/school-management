import React, { useMemo, useState } from "react";
import { Alert, Button, DatePicker, Empty, Segmented, Table, Typography, message } from "antd";
import { DownloadOutlined, ReloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import { useStatutoryReport } from "../../../hooks/payrollHooks";
import PageHeader from "../../../components/layout/PageHeader";
import { iconWell, pageCard, pageWrapper, sectionPanel, statGrid, tableHeadCss } from "../../../styles/pageStyles";
import { formatCurrencyINR } from "../../../utils/payroll";

const { Text } = Typography;

const StatCard = ({ label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 0 }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
    <div style={iconWell(color, 40)}><SafetyCertificateOutlined /></div>
  </div>
);

const PF_COLUMNS = [
  { title: "Employee", dataIndex: "employeeName" },
  { title: "UAN", dataIndex: "uan" },
  { title: "PF Wage", dataIndex: "pfWage", render: (v) => formatCurrencyINR(v) },
  { title: "Employee PF", dataIndex: "employeePf", render: (v) => formatCurrencyINR(v) },
  { title: "VPF", dataIndex: "vpf", render: (v) => formatCurrencyINR(v) },
  { title: "Employer EPS", dataIndex: "employerEps", render: (v) => formatCurrencyINR(v) },
  { title: "Employer EPF", dataIndex: "employerEpf", render: (v) => formatCurrencyINR(v) },
  { title: "Admin Charges", dataIndex: "epfAdminCharges", render: (v) => formatCurrencyINR(v) },
  { title: "EDLI", dataIndex: "edli", render: (v) => formatCurrencyINR(v) },
];

const ESI_COLUMNS = [
  { title: "Employee", dataIndex: "employeeName" },
  { title: "ESIC Number", dataIndex: "esicNumber" },
  { title: "ESI Wage", dataIndex: "esiWage", render: (v) => formatCurrencyINR(v) },
  { title: "Employee ESI", dataIndex: "employeeEsi", render: (v) => formatCurrencyINR(v) },
  { title: "Employer ESI", dataIndex: "employerEsi", render: (v) => formatCurrencyINR(v) },
];

const PfEsiReports = () => {
  const [reportType, setReportType] = useState("pf");
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [downloading, setDownloading] = useState(false);
  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { loading, report, isEmpty, refreshReport } = useStatutoryReport(reportType, month, year);

  const rows = useMemo(() => report?.rows || [], [report]);
  const columns = reportType === "pf" ? PF_COLUMNS : ESI_COLUMNS;

  const totals = useMemo(() => {
    if (reportType === "pf") {
      return {
        employees: rows.length,
        employeeShare: rows.reduce((sum, r) => sum + Number(r.employeePf || 0) + Number(r.vpf || 0), 0),
        employerShare: rows.reduce((sum, r) => sum + Number(r.employerEps || 0) + Number(r.employerEpf || 0) + Number(r.epfAdminCharges || 0) + Number(r.edli || 0), 0),
      };
    }
    return {
      employees: rows.length,
      employeeShare: rows.reduce((sum, r) => sum + Number(r.employeeEsi || 0), 0),
      employerShare: rows.reduce((sum, r) => sum + Number(r.employerEsi || 0), 0),
    };
  }, [rows, reportType]);

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const response = await httpClient.get(`/payroll/reports/${reportType}`, {
        params: { month, year, export: "csv" },
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${reportType}-report-${year}-${String(month).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      message.error(error?.response?.data?.message || "Report export failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("pf-esi-report-tbl")}</style>

      <PageHeader
        title="PF / ESI Compliance Reports"
        subtitle="Monthly statutory contribution reports for EPFO / ESIC filing"
        icon={<SafetyCertificateOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={refreshReport} style={{ borderRadius: 8 }}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={isEmpty || !rows.length}
              loading={downloading}
              onClick={handleExportCsv}
              style={{ borderRadius: 8 }}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <div style={{
        ...sectionPanel, marginTop: 16, marginBottom: 16,
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <Segmented
          value={reportType}
          onChange={setReportType}
          options={[
            { label: "PF Report", value: "pf" },
            { label: "ESI Report", value: "esi" },
          ]}
        />
        <div style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Viewing {selectedMonth.format("MMMM YYYY")}
        </Text>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(v) => v && setSelectedMonth(v)}
          style={{ borderRadius: 8 }}
        />
      </div>

      {isEmpty ? (
        <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <Text strong style={{ fontSize: 16, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
            No Payroll Cycle for {selectedMonth.format("MMMM YYYY")}
          </Text>
          <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Generate the payroll cycle for this month first, then refresh.
          </Text>
          <div style={{ marginTop: 20 }}>
            <Alert
              type="info"
              showIcon
              message="Generate payroll cycle from Monthly Payroll Run page to see statutory reports."
              style={{ borderRadius: 10, display: "inline-block", textAlign: "left" }}
            />
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...statGrid(200), marginBottom: 16 }}>
            <StatCard label={`${reportType.toUpperCase()}-Eligible Employees`} value={totals.employees} color="var(--primary)" />
            <StatCard label="Employee Contribution" value={formatCurrencyINR(totals.employeeShare)} color="var(--warning)" />
            <StatCard label="Employer Contribution" value={formatCurrencyINR(totals.employerShare)} color="var(--success)" />
          </div>

          <div style={{ ...pageCard, padding: 0, overflow: "hidden" }}>
            <Table
              className="pf-esi-report-tbl"
              rowKey={(r) => `${r.employeeName}-${r.uan || r.esicNumber}`}
              dataSource={rows}
              loading={loading}
              columns={columns}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
              locale={{
                emptyText: (
                  <div style={{ padding: "32px 0" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${reportType.toUpperCase()}-eligible employees this month`} />
                  </div>
                ),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PfEsiReports;

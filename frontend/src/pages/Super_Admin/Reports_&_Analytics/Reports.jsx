import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert, Button, DatePicker, Drawer, Dropdown, Empty, Form, Input, Modal, Popconfirm, Select, Skeleton,
  Table, Tag, Tooltip, message,
} from "antd";
import {
  BarChartOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, PlusOutlined,
  RightOutlined, SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

import apiClient from "../../../api/httpClient";
import { fetchSchools } from "../../../features/schoolSlice";
import { createReport, deleteReport, fetchReports } from "../../../features/reportSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { FilterGrid, FilterField } from "../../../components/attendance/FilterGrid";
import { FULL_WIDTH } from "../../../components/attendance/filterStyles";
import { modalTitle } from "../../../styles/pageStyles";
import SchoolOverview from "../../../components/reports/SchoolOverview";

/**
 * Reports — one school's numbers for a year, the reports people have saved, and the way to the
 * rest of the analytics.
 *
 * The page used to open on a form asking for "Report Data (JSON or text)", then charted how many
 * of those typed-in reports existed, in unstyled selects and a bare table whose Session column
 * always read "-". The server could already work out a real report — who is enrolled, class by
 * class, boys and girls, staff and parents — and nothing on the page asked it to. That report now
 * leads the page, and saving it is one click.
 */

const DAY = "D MMM YYYY";
const TYPES = [
  { value: "students", label: "Students" },
  { value: "attendance", label: "Attendance" },
  { value: "fees", label: "Fees" },
  { value: "performance", label: "Performance" },
  { value: "custom", label: "Custom" },
];
const typeLabel = (t) => TYPES.find((x) => x.value === t)?.label || t;
const errorText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;
/* ─────────────────────────── export ─────────────────────────── */
const exportRows = (items) => items.map((r) => ({
  Title: r.title || "",
  Type: typeLabel(r.type),
  School: r.school?.name || "",
  Session: r.session?.name || "",
  "Saved by": r.generatedBy?.name || "",
  Status: r.status || "",
  "Saved on": r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD") : "",
}));

function exportAs(kind, items) {
  const rows = exportRows(items);
  const stamp = dayjs().format("YYYY-MM-DD");
  if (kind === "excel") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Reports");
    XLSX.writeFile(wb, `reports-${stamp}.xlsx`);
    return;
  }
  const headers = Object.keys(rows[0] || { Title: "" });
  if (kind === "csv") {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `reports-${stamp}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    return;
  }
  const esc = (v) => String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const win = window.open("", "_blank");
  if (!win) { message.error("The print window was blocked by the browser"); return; }
  win.document.write(`<html><head><title>Reports — ${dayjs().format(DAY)}</title><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:12px}
    th{text-align:left;font-size:12px;border-bottom:2px solid #0f172a;padding:6px}td{font-size:12px;border-bottom:1px solid #e2e8f0;padding:6px}
  </style></head><body><h2>Saved reports — ${dayjs().format(DAY)}</h2><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

const MORE = [
  { path: "school-wise", title: "School-wise reports", note: "Compare schools side by side" },
  { path: "finance", title: "Finance summary", note: "Fees collected and outstanding" },
  { path: "academic", title: "Academic reports", note: "Exams and results" },
  { path: "attendance", title: "Attendance", note: "Presence across schools" },
  { path: "usage", title: "Platform usage", note: "Who is using what" },
  { path: "revenue", title: "Revenue", note: "Subscriptions over time" },
  { path: "activity", title: "Activity logs", note: "Who changed what, and when" },
];

/* ────────────────────────────────── page ────────────────────────────────── */
const Reports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { schools = [] } = useSelector((s) => s.school || {});
  const { items = [], loading: listLoading } = useSelector((s) => s.reports || {});

  /* the live school report */
  const [schoolId, setSchoolId] = useState(null);
  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [yearId, setYearId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* saved reports */
  const [filters, setFilters] = useState({ school: null, session: null, type: null, status: null, range: null });
  const [filterYears, setFilterYears] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customYears, setCustomYears] = useState([]);
  const [customForm] = Form.useForm();

  useEffect(() => { dispatch(fetchSchools({ limit: 500 })); }, [dispatch]);

  const yearsOf = useCallback(async (id) => {
    if (!id) return [];
    try {
      const res = await apiClient.get(`/academicYear/school/${id}`);
      return Array.isArray(res?.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  }, []);

  /* A school's years; the running one is picked for you. */
  useEffect(() => {
    let cancelled = false;
    setYears([]); setYearId(null); setOverview(null);
    if (!schoolId) return undefined;
    setYearsLoading(true);
    yearsOf(schoolId).then((list) => {
      if (cancelled) return;
      setYears(list);
      setYearId((list.find((y) => y.isActive) || list[0])?._id || null);
      setYearsLoading(false);
    });
    return () => { cancelled = true; };
  }, [schoolId, yearsOf]);

  useEffect(() => {
    let cancelled = false;
    if (!schoolId || !yearId) { setOverview(null); return undefined; }
    setOverviewLoading(true);
    apiClient.get(`/report/school/${schoolId}/academic-year/${yearId}`)
      .then((res) => { if (!cancelled) setOverview(res?.data?.data || null); })
      .catch((e) => { if (!cancelled) { setOverview(null); message.error(errorText(e, "Could not work out the report")); } })
      .finally(() => { if (!cancelled) setOverviewLoading(false); });
    return () => { cancelled = true; };
  }, [schoolId, yearId]);

  const loadSaved = useCallback(() => {
    const q = {};
    if (filters.school) q.school = filters.school;
    if (filters.session) q.session = filters.session;
    if (filters.type) q.type = filters.type;
    if (filters.status) q.status = filters.status;
    if (filters.range?.[0] || filters.range?.[1]) {
      q.createdAt = {
        ...(filters.range?.[0] ? { gte: dayjs(filters.range[0]).startOf("day").toISOString() } : {}),
        ...(filters.range?.[1] ? { lte: dayjs(filters.range[1]).endOf("day").toISOString() } : {}),
      };
    }
    q.sort = "-createdAt";
    q.limit = 200;
    dispatch(fetchReports(q));
  }, [dispatch, filters]);

  const school = schools.find((s) => s._id === schoolId);
  const year = years.find((y) => y._id === yearId);

  const saveOverview = async () => {
    if (!overview || !school || !year) return;
    setSaving(true);
    try {
      await dispatch(createReport({
        title: `${school.name} · ${year.name} · Students`,
        type: "students",
        school: school._id,
        session: year._id,
        status: "finalized",
        data: overview,
        filtersApplied: { schoolId: school._id, academicYearId: year._id },
      })).unwrap();
      message.success("Saved — it is in the list below");
      loadSaved();
    } catch (e) {
      message.error(e?.message || "Could not save the report");
    } finally {
      setSaving(false);
    }
  };

  /* saved reports: filters → query */
  useEffect(() => {
    let cancelled = false;
    setFilterYears([]);
    if (filters.school) yearsOf(filters.school).then((list) => { if (!cancelled) setFilterYears(list); });
    return () => { cancelled = true; };
  }, [filters.school, yearsOf]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const setFilter = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const activeFilters = ["school", "session", "type", "status", "range"].filter((k) => filters[k]).length;

  const removeReport = async (id) => {
    try {
      await dispatch(deleteReport(id)).unwrap();
      message.success("Report deleted");
    } catch (e) {
      message.error(e?.message || "Could not delete the report");
    }
  };

  /* custom report */
  const customSchool = Form.useWatch("school", customForm);
  useEffect(() => {
    let cancelled = false;
    setCustomYears([]);
    if (customSchool) {
      yearsOf(customSchool).then((list) => {
        if (cancelled) return;
        setCustomYears(list);
        const running = list.find((y) => y.isActive);
        if (running && !customForm.getFieldValue("session")) customForm.setFieldValue("session", running._id);
      });
    }
    return () => { cancelled = true; };
  }, [customSchool, yearsOf, customForm]);

  const saveCustom = async () => {
    let values;
    try {
      values = await customForm.validateFields();
    } catch {
      return; // the form already shows what is missing
    }
    try {
      await dispatch(createReport({ ...values, status: values.status || "finalized" })).unwrap();
      message.success("Report saved");
      setCustomOpen(false);
      customForm.resetFields();
      loadSaved();
    } catch (e) {
      message.error(e?.message || "Could not save the report");
    }
  };

  const columns = [
    {
      title: "Report",
      key: "title",
      render: (_, r) => (
        <div>
          <div className="u-strong">{r.title || `${typeLabel(r.type)} report`}</div>
          <Tag style={{ marginTop: 4 }}>{typeLabel(r.type)}</Tag>
          {r.status === "draft" && <Tag color="gold">Draft</Tag>}
        </div>
      ),
    },
    { title: "School", key: "school", render: (_, r) => r.school?.name || "—" },
    { title: "Session", key: "session", render: (_, r) => r.session?.name || "—" },
    {
      title: "Saved",
      key: "createdAt",
      render: (_, r) => (
        <div>
          <div>{r.createdAt ? dayjs(r.createdAt).format(DAY) : "—"}</div>
          <div className="u-meta">{r.generatedBy?.name ? `by ${r.generatedBy.name}` : ""}</div>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      width: 96,
      render: (_, r) => (
        <span style={{ whiteSpace: "nowrap" }}>
          <Tooltip title="Open">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewing(r)} />
          </Tooltip>
          <Popconfirm title="Delete this report?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => removeReport(r._id)}>
            <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </span>
      ),
    },
  ];

  const viewingIsOverview = Boolean(viewing?.data?.summary && viewing?.data?.classWise);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reports"
        subtitle="Pick a school to see its numbers for the year — save a copy whenever you need one"
        icon={<BarChartOutlined />}
        extra={<Button icon={<PlusOutlined />} onClick={() => setCustomOpen(true)}>Write a custom report</Button>}
      />

      {/* ── 1. a school, this year ── */}
      <div className="section-panel">
        <FilterGrid>
          <FilterField label="School">
            <Select
              style={FULL_WIDTH} showSearch optionFilterProp="label" placeholder="Pick a school"
              value={schoolId || undefined} onChange={(v) => setSchoolId(v || null)}
              options={schools.map((s) => ({ value: s._id, label: s.name }))}
            />
          </FilterField>
          <FilterField label="Academic year">
            <Select
              style={FULL_WIDTH} placeholder={!schoolId ? "Pick a school first" : yearsLoading ? "Loading…" : "No years set up"}
              disabled={!years.length} value={yearId || undefined} onChange={setYearId}
              options={years.map((y) => ({ value: y._id, label: `${y.name}${y.isActive ? " · running" : ""}` }))}
            />
          </FilterField>
          <FilterField>
            <Button style={FULL_WIDTH} icon={<SaveOutlined />} disabled={!overview} loading={saving} onClick={saveOverview}>
              Save a copy
            </Button>
          </FilterField>
        </FilterGrid>

        <div className="u-mt-5">
          {!schoolId ? (
            <Empty description="Pick a school to see its report" />
          ) : !yearsLoading && !years.length ? (
            <Alert type="info" showIcon message={`${school?.name || "This school"} has no academic years yet, so there is nothing to report on.`} />
          ) : overviewLoading || !overview ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <SchoolOverview data={overview} yearName={year?.name} />
          )}
        </div>
      </div>

      {/* ── 2. saved reports ── */}
      <div className="section-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
            Saved reports
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>{items.length}</span>
          </div>
          {activeFilters > 0 && (
            <Button type="link" onClick={() => setFilters({ school: null, session: null, type: null, status: null, range: null })}>
              Clear filters ({activeFilters})
            </Button>
          )}
          <Dropdown
            disabled={!items.length}
            menu={{
              items: [
                { key: "excel", label: "Excel" },
                { key: "csv", label: "CSV" },
                { key: "print", label: "Print or save as PDF" },
              ],
              onClick: ({ key }) => exportAs(key, items),
            }}
          >
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        </div>

        <FilterGrid>
          <FilterField label="School">
            <Select
              style={FULL_WIDTH} allowClear showSearch optionFilterProp="label" placeholder="All schools"
              value={filters.school || undefined} onChange={(v) => setFilter({ school: v || null, session: null })}
              options={schools.map((s) => ({ value: s._id, label: s.name }))}
            />
          </FilterField>
          <FilterField label="Session">
            <Select
              style={FULL_WIDTH} allowClear placeholder={filters.school ? "All sessions" : "Pick a school first"}
              disabled={!filters.school} value={filters.session || undefined} onChange={(v) => setFilter({ session: v || null })}
              options={filterYears.map((y) => ({ value: y._id, label: y.name }))}
            />
          </FilterField>
          <FilterField label="Type">
            <Select style={FULL_WIDTH} allowClear placeholder="All types" value={filters.type || undefined} onChange={(v) => setFilter({ type: v || null })} options={TYPES} />
          </FilterField>
          <FilterField label="Status">
            <Select
              style={FULL_WIDTH} allowClear placeholder="Any status" value={filters.status || undefined} onChange={(v) => setFilter({ status: v || null })}
              options={[{ value: "finalized", label: "Finalized" }, { value: "draft", label: "Draft" }]}
            />
          </FilterField>
          <FilterField label="Saved between">
            <DatePicker.RangePicker style={FULL_WIDTH} value={filters.range} onChange={(v) => setFilter({ range: v })} format="D MMM" />
          </FilterField>
        </FilterGrid>

        <div className="u-mt-4">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={items}
            loading={listLoading}
            size="middle"
            scroll={{ x: 640 }}
            pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
            onRow={(r) => ({ onDoubleClick: () => setViewing(r) })}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={activeFilters ? "No saved report matches these filters" : "Nothing saved yet — pick a school above and press “Save a copy”"}
                />
              ),
            }}
          />
        </div>
      </div>

      {/* ── 3. everything else ── */}
      <div className="section-panel">
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)", marginBottom: 12 }}>More reports</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {MORE.map((m) => (
            <button
              key={m.path}
              type="button"
              onClick={() => navigate(`/dashboard/superadmin/reports/${m.path}`)}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer",
                padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border-muted)",
                background: "var(--surface)", color: "inherit", font: "inherit",
              }}
            >
              <span className="u-grow">
                <span style={{ display: "block", fontWeight: 600, color: "var(--text-primary)" }}>{m.title}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>{m.note}</span>
              </span>
              <RightOutlined className="u-meta" />
            </button>
          ))}
        </div>
      </div>

      {/* ── open a saved report ── */}
      <Drawer
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        width={Math.min(760, typeof window !== "undefined" ? window.innerWidth - 24 : 760)}
        title={viewing && modalTitle(
          <FileTextOutlined />,
          viewing.title || `${typeLabel(viewing.type)} report`,
          [viewing.school?.name, viewing.session?.name, viewing.createdAt && `saved ${dayjs(viewing.createdAt).format(DAY)}`, viewing.generatedBy?.name && `by ${viewing.generatedBy.name}`].filter(Boolean).join(" · "),
        )}
      >
        {viewing && (viewingIsOverview ? (
          <>
            <Alert
              type="info"
              showIcon
              className="u-mb-4"
              message="A copy as it stood when it was saved"
              description="Pick the same school above to see today's numbers."
            />
            <SchoolOverview data={viewing.data} yearName={viewing.session?.name} />
          </>
        ) : (
          <pre style={{
            whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "inherit", fontSize: 14,
            color: "var(--text-primary)", background: "var(--surface-soft)", padding: 16, borderRadius: 12,
          }}>
            {typeof viewing.data === "object" ? JSON.stringify(viewing.data, null, 2) : String(viewing.data ?? "")}
          </pre>
        ))}
      </Drawer>

      {/* ── write a custom report ── */}
      <Modal
        open={customOpen}
        onCancel={() => setCustomOpen(false)}
        onOk={saveCustom}
        okText="Save report"
        destroyOnClose
        centered
        width={560}
        title={modalTitle(<PlusOutlined />, "Custom report", "For something the reports above do not cover — a note, a finding, a summary")}
      >
        <Form form={customForm} layout="vertical" requiredMark={false} initialValues={{ type: "custom", status: "finalized" }} className="u-mt-3">
          <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true, message: "Give it a title" }]}>
            <Input placeholder="Term 1 fee follow-up" maxLength={140} />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="school" label="School" rules={[{ required: true, message: "Which school is it about?" }]}>
              <Select showSearch optionFilterProp="label" placeholder="Pick a school" options={schools.map((s) => ({ value: s._id, label: s.name }))} onChange={() => customForm.setFieldValue("session", undefined)} />
            </Form.Item>
            <Form.Item name="session" label="Session" rules={[{ required: true, message: "Which year is it for?" }]}>
              <Select disabled={!customSchool} placeholder={customSchool ? "Pick a year" : "Pick a school first"} options={customYears.map((y) => ({ value: y._id, label: `${y.name}${y.isActive ? " · running" : ""}` }))} />
            </Form.Item>
            <Form.Item name="type" label="Type">
              <Select options={TYPES} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select options={[{ value: "finalized", label: "Finalized" }, { value: "draft", label: "Draft" }]} />
            </Form.Item>
          </div>
          <Form.Item name="data" label="Report" rules={[{ required: true, whitespace: true, message: "Write what the report says" }]} style={{ marginBottom: 0 }}>
            <Input.TextArea rows={6} placeholder="What was found, and what should happen next" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reports;

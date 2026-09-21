import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Empty, Select, Skeleton, Table, Tag } from "antd";
import { BankOutlined, CalendarOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import apiClient from "../../../api/httpClient";
import { fetchSchools } from "../../../features/schoolSlice.js";
import PageHeader from "../../../components/layout/PageHeader";
import { FilterGrid, FilterField } from "../../../components/attendance/FilterGrid";
import { FULL_WIDTH } from "../../../components/attendance/filterStyles";
import SchoolOverview, { InlineBar } from "../../../components/reports/SchoolOverview";

/**
 * School Reports — one school, any of its years, and how its roll has changed year to year.
 *
 * The page used to show only the running year, as four numbers, then the same four numbers again
 * as a one-row table, and a third time in a drawer behind a "View" button; a school without a
 * running year got a warning and nothing else. The class-by-class and boys-and-girls figures the
 * server sends were never drawn. Now every year can be opened, the school and year stay in the
 * address so a refresh or a shared link comes back to the same report, and the table compares
 * the years instead of repeating one of them.
 */

const DAY = "D MMM YYYY";
/** Years whose numbers are worked out up front for the comparison; older ones load when opened. */
const COMPARE_YEARS = 8;
const errorText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;
const count = (n) => Number(n || 0).toLocaleString("en-IN");

const yearTag = (year) => {
  if (year.status === "archived") return <Tag>Archived</Tag>;
  if (year.isActive) return <Tag color="green">Running</Tag>;
  if (dayjs(year.startDate).isAfter(dayjs(), "day")) return <Tag color="blue">Upcoming</Tag>;
  return null;
};

const SchoolReports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { schools = [] } = useSelector((s) => s.school || {});
  const [params, setParams] = useSearchParams();
  const schoolId = params.get("school");
  const yearParam = params.get("year");

  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [yearsError, setYearsError] = useState(null);
  const [overviews, setOverviews] = useState({});   // yearId → { loading } | { data } | { error }
  const token = useRef(0);                           // a newer school choice wins over late replies

  useEffect(() => { dispatch(fetchSchools()); }, [dispatch]);

  const loadOverview = useCallback(async (sid, yid, tok) => {
    setOverviews((o) => ({ ...o, [yid]: { loading: true } }));
    try {
      const res = await apiClient.get(`/report/school/${sid}/academic-year/${yid}`);
      if (tok === token.current) setOverviews((o) => ({ ...o, [yid]: { data: res?.data?.data || null } }));
    } catch (e) {
      if (tok === token.current) setOverviews((o) => ({ ...o, [yid]: { error: errorText(e, "Could not work out the report") } }));
    }
  }, []);

  const loadYears = useCallback(async () => {
    const tok = ++token.current;
    setYears([]); setOverviews({}); setYearsError(null);
    if (!schoolId) { setYearsLoading(false); return; }
    setYearsLoading(true);
    try {
      const res = await apiClient.get(`/academicYear/school/${schoolId}`);
      if (tok !== token.current) return;
      const list = (Array.isArray(res?.data?.data) ? res.data.data : [])
        .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());
      setYears(list);
      list.slice(0, COMPARE_YEARS).forEach((y) => loadOverview(schoolId, y._id, tok));
    } catch (e) {
      if (tok === token.current) setYearsError(errorText(e, "Could not load the school's academic years"));
    } finally {
      if (tok === token.current) setYearsLoading(false);
    }
  }, [schoolId, loadOverview]);

  useEffect(() => { loadYears(); }, [loadYears]);

  const school = schools.find((s) => s._id === schoolId);
  const year = years.find((y) => y._id === yearParam) || years.find((y) => y.isActive) || years[0] || null;
  const current = year ? overviews[year._id] : null;

  /* A year older than the compared ones is worked out when it is opened. */
  useEffect(() => {
    if (schoolId && year && !overviews[year._id]) loadOverview(schoolId, year._id, token.current);
  }, [schoolId, year, overviews, loadOverview]);

  const choose = (patch) => setParams((p) => {
    const next = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  /* ── year by year ── */
  const compared = useMemo(() => years.slice(0, COMPARE_YEARS), [years]);
  const rows = useMemo(() => compared.map((y, i) => {
    const students = overviews[y._id]?.data?.summary?.studentCount;
    const older = compared[i + 1] && overviews[compared[i + 1]._id]?.data?.summary?.studentCount;
    return { year: y, students, change: students != null && older != null ? students - older : null, olderName: compared[i + 1]?.name };
  }), [compared, overviews]);
  const maxStudents = Math.max(1, ...rows.map((r) => r.students || 0));

  const columns = [
    {
      title: "Year",
      key: "year",
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{r.year.name}</span>{" "}
          {yearTag(r.year)}
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {dayjs(r.year.startDate).format(DAY)} – {dayjs(r.year.endDate).format(DAY)}
          </div>
        </div>
      ),
    },
    {
      title: "Students",
      key: "students",
      width: "40%",
      render: (_, r) => (overviews[r.year._id]?.error ? (
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Could not load</span>
      ) : r.students == null ? (
        <Skeleton.Input active size="small" style={{ width: 160, minWidth: 0 }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 64px", alignItems: "center", gap: 10 }}>
          <InlineBar value={r.students} max={maxStudents} />
          <span style={{ fontWeight: 600, color: "var(--text-primary)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{count(r.students)}</span>
        </div>
      )),
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      render: (_, r) => (r.change == null ? (
        <span style={{ color: "var(--text-muted)" }}>—</span>
      ) : (
        <span style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }} title={`Compared with ${r.olderName}`}>
          {r.change > 0 ? "+" : r.change < 0 ? "−" : ""}{count(Math.abs(r.change))}
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}> vs {r.olderName}</span>
        </span>
      )),
    },
  ];

  return (
    <div className="page-wrapper">
      <style>{`.sr-open td { background: var(--primary-light) !important; } .sr-row { cursor: pointer; }`}</style>
      <PageHeader
        title="School Reports"
        subtitle="Pick a school to see its students class by class — for this year or any year before"
        icon={<BankOutlined />}
      />

      <div className="section-panel">
        <FilterGrid>
          <FilterField label="School">
            <Select
              style={FULL_WIDTH} showSearch optionFilterProp="label" placeholder="Pick a school"
              value={schoolId || undefined}
              onChange={(v) => choose({ school: v, year: null })}
              options={schools.map((s) => ({ value: s._id, label: s.name }))}
            />
          </FilterField>
          <FilterField label="Academic year">
            <Select
              style={FULL_WIDTH}
              placeholder={!schoolId ? "Pick a school first" : yearsLoading ? "Loading…" : "No years set up"}
              disabled={!years.length}
              value={year?._id}
              onChange={(v) => choose({ year: v })}
              options={years.map((y) => ({ value: y._id, label: `${y.name}${y.isActive ? " · running" : ""}` }))}
            />
          </FilterField>
        </FilterGrid>
      </div>

      {!schoolId ? (
        <div className="section-panel"><Empty description="Pick a school to see its report" /></div>
      ) : yearsError ? (
        <Alert
          type="error" showIcon style={{ marginBottom: 16 }} message={yearsError}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={loadYears}>Try again</Button>}
        />
      ) : yearsLoading ? (
        <div className="section-panel"><Skeleton active paragraph={{ rows: 6 }} /></div>
      ) : !years.length ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${school?.name || "This school"} has no academic years yet`}
          description="A report counts the students enrolled in a year, so the school needs one set up first."
          action={(
            <Button size="small" type="primary" icon={<CalendarOutlined />} onClick={() => navigate("/dashboard/superadmin/academics/academic-years")}>
              Set up years
            </Button>
          )}
        />
      ) : (
        <>
          <div className="section-panel">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                {school?.name || "School"} · {year.name} {yearTag(year)}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {dayjs(year.startDate).format(DAY)} – {dayjs(year.endDate).format(DAY)}
              </div>
            </div>
            {current?.error ? (
              <Alert
                type="error" showIcon message={current.error}
                action={<Button size="small" icon={<ReloadOutlined />} onClick={() => loadOverview(schoolId, year._id, token.current)}>Try again</Button>}
              />
            ) : !current?.data ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <SchoolOverview data={current.data} yearName={year.name} />
            )}
          </div>

          {years.length > 1 && (
            <div className="section-panel">
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>Year by year</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                Students who studied in each year{years.length > COMPARE_YEARS ? ` — the latest ${COMPARE_YEARS}` : ""}. Pick a year to open it above.
              </div>
              <Table
                rowKey={(r) => r.year._id}
                columns={columns}
                dataSource={rows}
                pagination={false}
                size="middle"
                scroll={{ x: 560 }}
                rowClassName={(r) => `sr-row${r.year._id === year._id ? " sr-open" : ""}`}
                onRow={(r) => ({
                  onClick: () => {
                    choose({ year: r.year._id });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  },
                })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SchoolReports;

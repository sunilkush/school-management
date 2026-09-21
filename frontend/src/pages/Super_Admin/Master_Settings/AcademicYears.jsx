import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Checkbox, DatePicker, Drawer, Dropdown, Empty, Form, Modal, Progress, Select, Skeleton, Tag, message,
} from "antd";
import {
  CalendarOutlined, CheckCircleFilled, DeleteOutlined, EditOutlined, InboxOutlined, MoreOutlined, PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import apiClient from "../../../api/httpClient";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActiveAcademicYear, setSelectedAcademicYear } from "../../../features/academicYearSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { modalTitle } from "../../../styles/pageStyles";

/**
 * Academic Years — a school's sessions, which one is running, and the next one.
 *
 * The page used to open empty for a Super Admin, with the school picker below three stat cards
 * that showed whatever year some other page had last loaded, a New Year button that only
 * complained after you had filled the form, and a six-column table for what is usually three
 * rows. Now the school comes first, the running year is at the top with how far through it the
 * school is, and the list says of every year whether it is running, upcoming, finished or
 * archived.
 *
 * It keeps its own list rather than the shared one: activating a year through the shared slice
 * also changes the year in the header, which for a Super Admin managing some other school is the
 * wrong year to switch to.
 */

const DAY = "D MMM YYYY";
const errorText = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

/** Noon, so the date is the same calendar day on the server whatever the browser's time zone. */
const atNoon = (d) => dayjs(d).hour(12).minute(0).second(0).millisecond(0).toISOString();

const yearName = (start, end) => {
  const a = dayjs(start).year();
  const b = dayjs(end).year();
  return a === b ? String(a) : `${a}-${b}`;
};

/** Whole months, counting the last day: 1 Apr – 31 Mar is 12 months, not the 11 a month diff gives. */
const monthsBetween = (start, end) => Math.max(1, Math.round((dayjs(end).add(1, "day").diff(dayjs(start), "day")) / 30.44));

function statusOf(year, today = dayjs()) {
  if (year.status === "archived") return { key: "archived", label: "Archived", color: "default" };
  if (year.isActive) return { key: "running", label: "Running", color: "green" };
  if (dayjs(year.startDate).isAfter(today, "day")) return { key: "upcoming", label: "Upcoming", color: "blue" };
  if (dayjs(year.endDate).isBefore(today, "day")) return { key: "finished", label: "Finished", color: "default" };
  return { key: "current", label: "In session · not running", color: "orange" };
}

/** Common session shapes, starting from the day after the latest year ends (or this year). */
function presetsAfter(years) {
  const latestEnd = years.reduce((max, y) => (!max || dayjs(y.endDate).isAfter(max) ? dayjs(y.endDate) : max), null);
  // A school with no years yet needs the session it is in now, not next year's.
  const from = latestEnd ? latestEnd.add(1, "day") : dayjs().subtract(11, "month");
  const next = (month) => {
    let start = from.month(month).date(1);
    if (start.isBefore(from, "day")) start = start.add(1, "year");
    return [start, start.add(1, "year").subtract(1, "day")];
  };
  return [
    { label: "April – March", value: next(3) },
    { label: "June – May", value: next(5) },
    { label: "January – December", value: next(0) },
  ];
}

/* ─────────────────────────── the running year ─────────────────────────── */
const RunningYear = ({ year, onPlanNext }) => {
  const today = dayjs();
  const start = dayjs(year.startDate);
  const end = dayjs(year.endDate);
  const total = Math.max(1, end.diff(start, "day") + 1);
  const done = Math.min(total, Math.max(0, today.diff(start, "day") + 1));
  const ended = today.isAfter(end, "day");
  const notStarted = today.isBefore(start, "day");
  const left = end.diff(today, "day");

  return (
    <div className="section-panel" style={{ borderLeft: `4px solid ${ended ? "var(--warning)" : "var(--success)"}` }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--success-hover)" }}>
            <CheckCircleFilled /> Running year
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>{year.name}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {start.format(DAY)} – {end.format(DAY)} · {monthsBetween(start, end)} months
          </div>
        </div>
        <div style={{ flex: "2 1 320px" }}>
          <Progress
            percent={Math.round((done / total) * 100)}
            status={ended ? "exception" : "active"}
            showInfo={false}
            strokeColor={ended ? "var(--warning)" : "var(--success)"}
          />
          <div style={{ fontSize: 13, color: ended ? "var(--warning-hover)" : "var(--text-secondary)", marginTop: 4 }}>
            {ended
              ? `It ended ${today.diff(end, "day")} day${today.diff(end, "day") === 1 ? "" : "s"} ago — classes, attendance and fees still default to it.`
              : notStarted
                ? `Starts in ${start.diff(today, "day")} days`
                : `Day ${done} of ${total} · ${left} day${left === 1 ? "" : "s"} left`}
          </div>
        </div>
        {(ended || left <= 60) && (
          <Button type={ended ? "primary" : "default"} icon={<PlusOutlined />} onClick={onPlanNext}>
            Set up the next year
          </Button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────── one year in the list ─────────────────────────── */
const YearRow = ({ year, onSetRunning, onEdit, onArchive, onDelete, busy }) => {
  const s = statusOf(year);
  const start = dayjs(year.startDate);
  const end = dayjs(year.endDate);
  const archived = s.key === "archived";
  // Going back to a finished year is rare and easy to click by mistake, so for those it sits in the menu.
  const runnable = !archived && !year.isActive;
  const runButton = runnable && (s.key === "upcoming" || s.key === "current");

  const menu = [
    runnable && !runButton && { key: "run", icon: <CheckCircleFilled />, label: "Set running", onClick: () => onSetRunning(year) },
    !archived && { key: "edit", icon: <EditOutlined />, label: "Change dates", onClick: () => onEdit(year) },
    !archived && !year.isActive && { key: "archive", icon: <InboxOutlined />, label: "Archive", onClick: () => onArchive(year) },
    !year.isActive && { type: "divider" },
    !year.isActive && { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true, onClick: () => onDelete(year) },
  ].filter(Boolean);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        padding: "12px 4px", borderTop: "1px solid var(--border-muted)",
        opacity: archived ? 0.7 : 1,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: year.isActive ? "var(--success-light)" : "var(--surface-soft)",
        color: year.isActive ? "var(--success-hover)" : "var(--text-muted)",
      }}>
        <CalendarOutlined />
      </div>
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
          {year.name} <Tag color={s.color} style={{ marginLeft: 6 }}>{s.label}</Tag>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {start.format(DAY)} – {end.format(DAY)} · {monthsBetween(start, end)} months
        </div>
      </div>
      {runButton && (
        <Button size="small" onClick={() => onSetRunning(year)} loading={busy === year._id}>
          Set running
        </Button>
      )}
      {menu.length > 0 && (
        <Dropdown menu={{ items: menu }} trigger={["click"]} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`More for ${year.name}`} />
        </Dropdown>
      )}
    </div>
  );
};

/* ────────────────────────────────── page ────────────────────────────────── */
const AcademicYearPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { schools = [] } = useSelector((s) => s.school || {});

  const isSuperAdmin = user?.role?.name === "Super Admin";
  const [schoolId, setSchoolId] = useState(isSuperAdmin ? null : (user?.school?._id || user?.schoolId || null));
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [drawer, setDrawer] = useState(null);         // null | { mode: "create" } | { mode: "edit", year }
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { if (isSuperAdmin) dispatch(fetchSchools()); }, [dispatch, isSuperAdmin]);

  const load = useCallback(async () => {
    if (!schoolId) { setYears([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get(`/academicYear/school/${schoolId}`);
      setYears(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (e) {
      message.error(errorText(e, "Could not load the academic years"));
      setYears([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(
    () => [...years].sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf()),
    [years],
  );
  const running = sorted.find((y) => y.isActive) || null;
  const archivedCount = sorted.filter((y) => y.status === "archived").length;
  const listed = sorted.filter((y) => !y.isActive && (showArchived || y.status !== "archived"));
  const inSessionButIdle = !running && sorted.find((y) => statusOf(y).key === "current");

  /* After a change to the running year, a school's own staff see it in their header too. */
  const syncHeader = async () => {
    if (isSuperAdmin || !schoolId) return;
    const result = await dispatch(fetchActiveAcademicYear(schoolId));
    if (result?.payload) dispatch(setSelectedAcademicYear(result.payload));
  };

  /* ── drawer ── */
  const openCreate = () => {
    const [start, end] = presetsAfter(sorted)[0].value;
    form.setFieldsValue({ dateRange: [start, end], setRunning: !running });
    setDrawer({ mode: "create" });
  };
  const openEdit = (year) => {
    form.setFieldsValue({ dateRange: [dayjs(year.startDate), dayjs(year.endDate)], setRunning: false });
    setDrawer({ mode: "edit", year });
  };
  const closeDrawer = () => { setDrawer(null); form.resetFields(); };

  const range = Form.useWatch("dateRange", form);
  const overlap = useMemo(() => {
    if (!range?.[0] || !range?.[1]) return null;
    return sorted.find((y) => y._id !== drawer?.year?._id
      && !dayjs(y.startDate).isAfter(range[1], "day")
      && !dayjs(y.endDate).isBefore(range[0], "day")) || null;
  }, [range, sorted, drawer]);

  const save = async () => {
    const { dateRange, setRunning } = await form.validateFields();
    const [start, end] = dateRange;
    setSaving(true);
    try {
      if (drawer.mode === "edit") {
        await apiClient.put(`/academicYear/${drawer.year._id}`, { startDate: atNoon(start), endDate: atNoon(end) });
        message.success(`${yearName(start, end)} updated`);
      } else {
        await apiClient.post("/academicYear/create", {
          schoolId, startDate: atNoon(start), endDate: atNoon(end), isActive: Boolean(setRunning),
        });
        message.success(`${yearName(start, end)} created${setRunning ? " and set running" : ""}`);
      }
      closeDrawer();
      await load();
      if (drawer.mode === "edit" ? drawer.year.isActive : setRunning) await syncHeader();
    } catch (e) {
      message.error(errorText(e, "Could not save the academic year"));
    } finally {
      setSaving(false);
    }
  };

  /* ── row actions ── */
  const setRunningYear = (year) => {
    Modal.confirm({
      title: `Set ${year.name} running?`,
      content: running
        ? `${running.name} stops being the running year. Classes, attendance, fees and every page that starts on "this year" switch to ${year.name}.`
        : `Classes, attendance, fees and every page that starts on "this year" will use ${year.name}.`,
      okText: "Set running",
      centered: true,
      onOk: async () => {
        setBusy(year._id);
        try {
          await apiClient.post(`/academicYear/activate/${year._id}`);
          message.success(`${year.name} is now the running year`);
          await load();
          await syncHeader();
        } catch (e) {
          message.error(errorText(e, "Could not set the year running"));
        } finally {
          setBusy(null);
        }
      },
    });
  };

  const archiveYear = (year) => {
    Modal.confirm({
      title: `Archive ${year.name}?`,
      content: "It stays on record with everything filed under it, but can no longer be changed or set running.",
      okText: "Archive",
      centered: true,
      onOk: async () => {
        try {
          await apiClient.post(`/academicYear/archive/${year._id}`);
          message.success(`${year.name} archived`);
          await load();
        } catch (e) {
          message.error(errorText(e, "Could not archive the year"));
        }
      },
    });
  };

  const deleteYear = (year) => {
    Modal.confirm({
      title: `Delete ${year.name}?`,
      content: "Only a year with nothing filed under it can be deleted — if it has classes, students, exams or fees, archive it instead.",
      okText: "Delete",
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          await apiClient.delete(`/academicYear/${year._id}`);
          message.success(`${year.name} deleted`);
          await load();
        } catch (e) {
          // The server says what is filed under it; that is the useful part.
          Modal.warning({ title: `${year.name} was not deleted`, content: errorText(e, "Could not delete the year"), centered: true });
        }
      },
    });
  };

  const presets = useMemo(() => presetsAfter(sorted), [sorted]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Academic Years"
        subtitle="A school's sessions — which one is running, and the next one to set up"
        icon={<CalendarOutlined />}
        extra={
          <>
            {isSuperAdmin && (
              <Select
                style={{ minWidth: 240, marginRight: 8 }}
                showSearch
                optionFilterProp="label"
                placeholder="Pick a school"
                value={schoolId || undefined}
                onChange={(v) => setSchoolId(v || null)}
                options={schools.map((s) => ({ value: s._id, label: s.name }))}
              />
            )}
            <Button type="primary" icon={<PlusOutlined />} disabled={!schoolId} onClick={openCreate}>
              New year
            </Button>
          </>
        }
      />

      {!schoolId ? (
        <div className="section-panel">
          <Empty description={isSuperAdmin ? "Pick a school at the top to see its academic years" : "Your account is not linked to a school"} />
        </div>
      ) : loading && !years.length ? (
        <div className="section-panel"><Skeleton active paragraph={{ rows: 4 }} /></div>
      ) : (
        <>
          {running ? (
            <RunningYear year={running} onPlanNext={openCreate} />
          ) : sorted.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 12 }}
              message="No year is running"
              description={inSessionButIdle
                ? `Today falls in ${inSessionButIdle.name}, but it is not set running. Classes, attendance and fees have no year to start from until one is.`
                : "Classes, attendance and fees have no year to start from until one is set running."}
              action={inSessionButIdle && (
                <Button size="small" type="primary" onClick={() => setRunningYear(inSessionButIdle)}>
                  Set {inSessionButIdle.name} running
                </Button>
              )}
            />
          ) : null}

          <div className="section-panel">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
              <div style={{ flex: 1, fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>
                {running ? "Other years" : "Years"}
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                  {sorted.length} in all{archivedCount ? ` · ${archivedCount} archived` : ""}
                </span>
              </div>
              {archivedCount > 0 && (
                <Checkbox checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}>
                  Show archived
                </Checkbox>
              )}
            </div>

            {sorted.length === 0 ? (
              <Empty description="This school has no academic years yet">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Create the first one</Button>
              </Empty>
            ) : listed.length === 0 ? (
              <div style={{ padding: "16px 4px", fontSize: 13, color: "var(--text-muted)" }}>
                {archivedCount ? "Only archived years besides the running one — tick “Show archived” to see them." : "The running year is the only one."}
              </div>
            ) : (
              listed.map((year) => (
                <YearRow
                  key={year._id}
                  year={year}
                  busy={busy}
                  onSetRunning={setRunningYear}
                  onEdit={openEdit}
                  onArchive={archiveYear}
                  onDelete={deleteYear}
                />
              ))
            )}

            {running && (
              <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-muted)", display: "flex", gap: 8 }}>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(running)}>
                  Change {running.name}'s dates
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <Drawer
        open={Boolean(drawer)}
        onClose={closeDrawer}
        width={440}
        title={modalTitle(
          drawer?.mode === "edit" ? <EditOutlined /> : <PlusOutlined />,
          drawer?.mode === "edit" ? `Change ${drawer.year.name}` : "New academic year",
          drawer?.mode === "edit" ? "Its name follows the dates" : "Pick the first and last day of the session",
        )}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" loading={saving} disabled={Boolean(overlap)} onClick={save}>
              {drawer?.mode === "edit" ? "Save dates" : "Create year"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {drawer?.mode === "create" && (
            <Form.Item label="Session shape" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {presets.map((p) => (
                  <Button key={p.label} size="small" onClick={() => form.setFieldValue("dateRange", p.value)}>
                    {p.label} {yearName(p.value[0], p.value[1])}
                  </Button>
                ))}
              </div>
            </Form.Item>
          )}

          <Form.Item
            name="dateRange"
            label="First and last day"
            rules={[
              { required: true, message: "Pick the first and last day of the session" },
              {
                validator: (_, value) => {
                  if (!value?.[0] || !value?.[1]) return Promise.resolve();
                  if (!dayjs(value[1]).isAfter(value[0], "day")) return Promise.reject(new Error("The last day has to come after the first"));
                  if (dayjs(value[1]).diff(value[0], "month") > 18) return Promise.reject(new Error("That is longer than a year and a half — check the dates"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} format={DAY} allowClear={false} />
          </Form.Item>

          {range?.[0] && range?.[1] && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-soft)", marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>{yearName(range[0], range[1])}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {monthsBetween(range[0], range[1])} months · {dayjs(range[0]).format(DAY)} – {dayjs(range[1]).format(DAY)}
              </div>
            </div>
          )}

          {overlap && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message={`These dates overlap ${overlap.name}`}
              description={`${overlap.name} runs ${dayjs(overlap.startDate).format(DAY)} – ${dayjs(overlap.endDate).format(DAY)}. A school's years cannot share days.`}
            />
          )}

          {drawer?.mode === "create" && (
            <Form.Item name="setRunning" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>
                Set it running straight away
                {running && <span style={{ color: "var(--text-muted)" }}> (instead of {running.name})</span>}
              </Checkbox>
            </Form.Item>
          )}
          {drawer?.mode === "edit" && drawer.year.isActive && (
            <Alert type="info" showIcon message="This is the running year — its new dates apply everywhere straight away." />
          )}
        </Form>
      </Drawer>
    </div>
  );
};

export default AcademicYearPage;

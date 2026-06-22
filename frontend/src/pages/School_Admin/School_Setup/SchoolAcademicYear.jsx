import React, { useEffect, useState } from "react";
import {
  DatePicker, Button, Switch, Modal, Popconfirm,
  message, Typography, Skeleton, Tooltip, Tag,
} from "antd";
import {
  CalendarOutlined, PlusOutlined, CheckCircleFilled,
  EditOutlined, DeleteOutlined, InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  createAcademicYear,
  fetchAllAcademicYears,
  setActiveAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  archiveAcademicYear,
  clearAcademicYearMessages,
} from "../../../features/academicYearSlice";
import { useTheme } from "../../../context/ThemeContext";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const tok = (isDark) => ({
  cardBg:    isDark ? "#141414" : "#ffffff",
  innerBg:   isDark ? "#0f0f0f" : "#f8faff",
  border:    isDark ? "#1f1f1f" : "#f0f0f0",
  rowHover:  isDark ? "#1a1a1a" : "#f8faff",
  textPri:   isDark ? "#e8e8e8" : "#111827",
  textSec:   isDark ? "#6b7280" : "#9ca3af",
  accent:    "#1677ff",
  accentBg:  isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success:   "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  inputBg:   isDark ? "#1a1a1a" : "#ffffff",
  shadow:    isDark ? "0 2px 12px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.06)",
  thBg:      isDark ? "#0f0f0f" : "#f9fafb",
  thBorder:  isDark ? "#1f1f1f" : "#f0f0f0",
});

const SchoolAcademicYear = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tok(isDark);

  const { academicYears = [], loading, error, message: successMsg } =
    useSelector((s) => s.academicYear);
  const user     = useSelector((s) => s.auth.user);
  const schoolId = user?.school?._id;

  // ── Create form state ─────────────────────────────────────────────────
  const [createDates, setCreateDates] = useState([]);
  const [creating, setCreating]       = useState(false);

  // ── Edit modal state ──────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null);   // academic year object
  const [editDates,  setEditDates]  = useState([]);
  const [saving,     setSaving]     = useState(false);

  // ── Misc ──────────────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (schoolId) dispatch(fetchAllAcademicYears(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (error)      { message.error(error);       dispatch(clearAcademicYearMessages()); }
    if (successMsg) { message.success(successMsg); dispatch(clearAcademicYearMessages()); }
  }, [error, successMsg, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (createDates.length !== 2) return message.warning("Select a date range");
    setCreating(true);
    try {
      await dispatch(createAcademicYear({
        schoolId,
        startDate: createDates[0].toISOString(),
        endDate:   createDates[1].toISOString(),
      })).unwrap();
      setCreateDates([]);
      message.success("Academic year created");
    } catch (e) {
      message.error(e?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await dispatch(setActiveAcademicYear(id)).unwrap();
    } catch (e) {
      message.error(e?.message || "Failed to activate");
    }
  };

  const openEdit = (yr) => {
    setEditTarget(yr);
    setEditDates([dayjs(yr.startDate), dayjs(yr.endDate)]);
  };

  const handleUpdate = async () => {
    if (!editDates || editDates.length !== 2) return message.warning("Select a valid date range");
    setSaving(true);
    try {
      await dispatch(updateAcademicYear({
        id:   editTarget._id,
        data: {
          startDate: editDates[0].toISOString(),
          endDate:   editDates[1].toISOString(),
        },
      })).unwrap();
      message.success("Academic year updated");
      setEditTarget(null);
    } catch (e) {
      message.error(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (yr) => {
    if (yr.isActive) {
      message.warning("Cannot delete the active academic year. Set another year active first.");
      return;
    }
    try {
      await dispatch(deleteAcademicYear(yr._id)).unwrap();
      message.success("Academic year deleted");
    } catch (e) {
      message.error(e?.message || "Failed to delete");
    }
  };

  const handleArchive = async (yr) => {
    if (yr.status === "archived") return;
    try {
      await dispatch(archiveAcademicYear(yr._id)).unwrap();
      message.success("Academic year archived");
    } catch (e) {
      message.error(e?.message || "Failed to archive");
    }
  };

  const sorted = [...academicYears].sort((a, b) =>
    new Date(b.startDate) - new Date(a.startDate)
  );

  // ── Status badge ──────────────────────────────────────────────────────
  const StatusBadge = ({ yr }) => {
    if (yr.isActive)
      return (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontWeight: 600, color: t.success,
          background: t.successBg, padding: "3px 10px", borderRadius: 99,
        }}>
          <CheckCircleFilled style={{ fontSize: 10 }} /> Active
        </span>
      );
    if (yr.status === "archived")
      return (
        <span style={{
          fontSize: 11, fontWeight: 600, color: "#6b7280",
          background: isDark ? "#1f1f1f" : "#f3f4f6",
          padding: "3px 10px", borderRadius: 99,
        }}>
          Archived
        </span>
      );
    return (
      <span style={{
        fontSize: 11, color: t.textSec,
        background: isDark ? "#1a1a1a" : "#f3f4f6",
        padding: "3px 10px", borderRadius: 99,
      }}>
        Inactive
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Create form ────────────────────────────────────────────────── */}
      <div style={{
        background: t.innerBg, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: t.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlusOutlined style={{ fontSize: 12, color: t.accent }} />
          </div>
          <Text style={{ fontSize: 13, fontWeight: 700, color: t.textPri }}>
            Create New Academic Year
          </Text>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <RangePicker
            style={{ flex: 1, minWidth: 240, borderRadius: 8, height: 38 }}
            value={createDates}
            onChange={(val) => setCreateDates(val || [])}
            format="DD MMM YYYY"
            placeholder={["Start Date", "End Date"]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            loading={creating}
            disabled={createDates.length !== 2}
            style={{ borderRadius: 8, height: 38, fontWeight: 600, minWidth: 160 }}
          >
            Create Year
          </Button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.border}`,
        borderRadius: 12, overflow: "hidden",
      }}>

        {/* Desktop */}
        <div className="ay-desktop">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: t.thBg, borderBottom: `1px solid ${t.thBorder}` }}>
                  {["Year", "Date Range", "Duration", "Status", "Set Active", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: t.textSec,
                      letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && !sorted.length ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: "12px 16px" }}>
                        <Skeleton active title={false} paragraph={{ rows: 1 }} />
                      </td>
                    </tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 48, textAlign: "center" }}>
                      <CalendarOutlined style={{ fontSize: 32, color: t.textSec, display: "block", margin: "0 auto 12px" }} />
                      <Text style={{ color: t.textSec, fontSize: 13 }}>
                        No academic years yet — create one above.
                      </Text>
                    </td>
                  </tr>
                ) : (
                  sorted.map((yr, i) => {
                    const start  = dayjs(yr.startDate);
                    const end    = dayjs(yr.endDate);
                    const months = end.diff(start, "month");
                    const isHov  = hovered === i;
                    const isArchived = yr.status === "archived";

                    return (
                      <tr
                        key={yr._id}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          background: isHov ? t.rowHover : "transparent",
                          borderBottom: `1px solid ${t.thBorder}`,
                          opacity: isArchived ? 0.6 : 1,
                        }}
                      >
                        {/* Year name */}
                        <td style={{ padding: "12px 16px" }}>
                          <Text style={{ fontWeight: 700, fontSize: 14, color: t.textPri }}>
                            {yr.name}
                          </Text>
                          {yr.code && (
                            <div style={{ fontSize: 11, color: t.textSec, marginTop: 2 }}>
                              {yr.code}
                            </div>
                          )}
                        </td>

                        {/* Date range */}
                        <td style={{ padding: "12px 16px" }}>
                          <Text style={{ fontSize: 12, color: t.textSec }}>
                            {start.format("DD MMM YYYY")} → {end.format("DD MMM YYYY")}
                          </Text>
                        </td>

                        {/* Duration */}
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: t.accent,
                            background: t.accentBg, padding: "3px 10px", borderRadius: 99,
                          }}>
                            {months} months
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge yr={yr} />
                        </td>

                        {/* Set Active toggle */}
                        <td style={{ padding: "12px 16px" }}>
                          <Tooltip title={yr.isActive ? "Already active" : isArchived ? "Cannot activate archived year" : "Set as active year"}>
                            <Switch
                              checked={yr.isActive}
                              disabled={yr.isActive || isArchived}
                              size="small"
                              onChange={() => handleSetActive(yr._id)}
                            />
                          </Tooltip>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

                            {/* Edit */}
                            <Tooltip title={isArchived ? "Cannot edit archived year" : "Edit dates"}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                disabled={isArchived}
                                onClick={() => openEdit(yr)}
                                style={{
                                  color: isArchived ? t.textSec : t.accent,
                                  borderRadius: 6,
                                  padding: "0 8px",
                                }}
                              />
                            </Tooltip>

                            {/* Archive */}
                            {!isArchived && !yr.isActive && (
                              <Tooltip title="Archive this year">
                                <Popconfirm
                                  title="Archive academic year?"
                                  description="Archived years cannot be edited or set active."
                                  okText="Archive"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                  onConfirm={() => handleArchive(yr)}
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<InboxOutlined />}
                                    style={{ color: "#f59e0b", borderRadius: 6, padding: "0 8px" }}
                                  />
                                </Popconfirm>
                              </Tooltip>
                            )}

                            {/* Delete */}
                            <Tooltip title={yr.isActive ? "Cannot delete active year" : "Delete"}>
                              <Popconfirm
                                title="Delete academic year?"
                                description={
                                  yr.isActive
                                    ? "Set another year as active first."
                                    : "This action cannot be undone."
                                }
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, disabled: yr.isActive }}
                                onConfirm={() => handleDelete(yr)}
                                disabled={yr.isActive}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  disabled={yr.isActive}
                                  style={{
                                    color: yr.isActive ? t.textSec : "#ef4444",
                                    borderRadius: 6,
                                    padding: "0 8px",
                                  }}
                                />
                              </Popconfirm>
                            </Tooltip>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="ay-mobile">
          {loading && !sorted.length ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{ padding: 16, borderBottom: `1px solid ${t.border}` }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <Text style={{ color: t.textSec }}>No academic years yet.</Text>
            </div>
          ) : (
            sorted.map((yr) => {
              const start    = dayjs(yr.startDate);
              const end      = dayjs(yr.endDate);
              const months   = end.diff(start, "month");
              const isArchived = yr.status === "archived";

              return (
                <div key={yr._id} style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${t.border}`,
                  opacity: isArchived ? 0.6 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontWeight: 700, fontSize: 14, color: t.textPri }}>{yr.name}</Text>
                    <StatusBadge yr={yr} />
                  </div>

                  <Text style={{ fontSize: 12, color: t.textSec, display: "block", marginBottom: 8 }}>
                    {start.format("DD MMM YYYY")} → {end.format("DD MMM YYYY")} · {months} months
                  </Text>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <Switch
                      checked={yr.isActive}
                      disabled={yr.isActive || isArchived}
                      size="small"
                      onChange={() => handleSetActive(yr._id)}
                    />
                    <span style={{ fontSize: 12, color: t.textSec }}>Set active</span>

                    <div style={{ flex: 1 }} />

                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      disabled={isArchived}
                      onClick={() => openEdit(yr)}
                      style={{ borderRadius: 6, fontSize: 12 }}
                    >
                      Edit
                    </Button>

                    {!isArchived && !yr.isActive && (
                      <Popconfirm
                        title="Archive this year?"
                        okText="Archive" cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleArchive(yr)}
                      >
                        <Button size="small" icon={<InboxOutlined />} style={{ borderRadius: 6, fontSize: 12, color: "#f59e0b" }}>
                          Archive
                        </Button>
                      </Popconfirm>
                    )}

                    <Popconfirm
                      title="Delete this year?"
                      okText="Delete" cancelText="Cancel"
                      okButtonProps={{ danger: true, disabled: yr.isActive }}
                      onConfirm={() => handleDelete(yr)}
                      disabled={yr.isActive}
                    >
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        disabled={yr.isActive}
                        style={{ borderRadius: 6, fontSize: 12 }}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!editTarget}
        onCancel={() => setEditTarget(null)}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: t.accentBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <EditOutlined style={{ color: t.accent, fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.textPri }}>
                Edit Academic Year
              </div>
              <div style={{ fontSize: 12, color: t.textSec, fontWeight: 400 }}>
                {editTarget?.name}
              </div>
            </div>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={() => setEditTarget(null)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            disabled={!editDates || editDates.length !== 2}
            onClick={handleUpdate}
            style={{ fontWeight: 600 }}
          >
            Save Changes
          </Button>,
        ]}
        centered
        width={440}
      >
        <div style={{ padding: "16px 0 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.textSec, marginBottom: 8 }}>
            DATE RANGE
          </div>
          <RangePicker
            style={{ width: "100%", borderRadius: 8, height: 38 }}
            value={editDates}
            onChange={(val) => setEditDates(val || [])}
            format="DD MMM YYYY"
            placeholder={["Start Date", "End Date"]}
          />
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: t.accentBg, borderRadius: 8,
            fontSize: 12, color: t.accent,
          }}>
            The year name (e.g. 2025-2026) is auto-generated from the selected dates.
          </div>
        </div>
      </Modal>

      {/* Next step */}
      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            onClick={next}
            disabled={!academicYears.length}
            style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
          >
            Next: Boards →
          </Button>
        </div>
      )}

      <style>{`
        .ay-mobile  { display: none; }
        .ay-desktop { display: block; }
        @media (max-width: 640px) {
          .ay-desktop { display: none; }
          .ay-mobile  { display: block; }
        }
      `}</style>
    </div>
  );
};

export default SchoolAcademicYear;

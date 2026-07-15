import React, { useEffect, useMemo, useState } from "react";

import {
  Table,
  Select,
  Button,
  Space,
  Tag,
  message,
  Spin,
  Grid,
  Skeleton,
} from "antd";
import { TeamOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllUser } from "../../../features/authSlice";
import {
  assignClassTeacher,
  fetchSections,
} from "../../../features/sectionSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { useTheme } from "../../../context/ThemeContext";

const { Option } = Select;
const { useBreakpoint } = Grid;

const tokens = (isDark) => ({
  cardBg: isDark ? "#141414" : "#ffffff",
  innerBg: isDark ? "#0f0f0f" : "#f8faff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  textPri: isDark ? "#e8e8e8" : "#111827",
  textSec: isDark ? "#6b7280" : "#9ca3af",
  accent: "#1677ff",
  accentBg: isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success: "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  thBg: isDark ? "#0f0f0f" : "#f9fafb",
  thBorder: isDark ? "#1f1f1f" : "#f0f0f0",
});

// Class names are plain strings like "Class 10", "Nursery", "UKG" — a plain alphabetical sort
// would put "Class 10" before "Class 2". Pre-primary names get a fixed rank ahead of any numbered
// class (matching real school progression); numbered classes sort on the number they contain;
// anything unrecognized falls back to alphabetical, after the numbered classes.
const PRE_PRIMARY_RANK = { "pre-nursery": 0, "playgroup": 1, "nursery": 2, "lkg": 3, "kg": 3, "ukg": 4 };

const classSortKey = (name) => {
  const n = (name || "").trim().toLowerCase();
  if (n in PRE_PRIMARY_RANK) return PRE_PRIMARY_RANK[n];
  const match = n.match(/(\d+)/);
  if (match) return 100 + Number(match[1]);
  return 9999;
};

const compareClassNames = (a, b) => {
  const diff = classSortKey(a) - classSortKey(b);
  return diff !== 0 ? diff : (a || "").localeCompare(b || "");
};

const SchoolClassSectionTeacher = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { sections = [], loading } = useSelector((s) => s.section || {});
  const { users = [], user } = useSelector((s) => s.auth);
  const { selectedAcademicYear, activeYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [savingKey, setSavingKey] = useState(null);
  const [classFilter, setClassFilter] = useState(null);

  // selectedAcademicYear is normally populated as a side effect of <AcademicYearSwitcher> mounting
  // in the Topbar — but this is Step 5 of the setup wizard, right after Step 1 creates the academic
  // year, and the switcher may not have refreshed yet. Without this, academicYearId stays null and
  // the gated fetch below never fires, so this step showed "No Data Found" forever. The reducer
  // (academicYearSlice.js) is idempotent about this — repeating the fetch is harmless.
  useEffect(() => {
    if (schoolId && !activeYear) dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId, activeYear]);

  /* ───────── FETCH ───────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSections({ schoolId, academicYearId }));
    }

    dispatch(
      fetchAllUser({
        roleName: ["Teacher"],
        isActive: true,
      })
    );
  }, [dispatch, schoolId, academicYearId]);

  /* ───────── TABLE DATA ───────── */
  // sections arrives in raw DB order — sort by class (Nursery → Class 12), then by section within
  // a class, so this step reads in the same order a school admin thinks in.
  const tableData = useMemo(() => {
    return sections
      // A section with no schoolClassId (or a class ref that failed to populate — e.g. the class
      // was deleted) has nothing meaningful to assign a teacher to; skip it instead of showing an
      // "N/A" row.
      .filter((sec) => sec.schoolClassId?._id && sec.schoolClassId?.name)
      .map((sec) => ({
        key: sec._id,
        classId: sec.schoolClassId._id,
        className: sec.schoolClassId.name,
        sectionId: sec._id,
        sectionName: sec.name,
        teacherId: sec.classTeacherId?._id || null,
      }))
      .sort((a, b) => {
        const classDiff = compareClassNames(a.className, b.className);
        return classDiff !== 0 ? classDiff : (a.sectionName || "").localeCompare(b.sectionName || "");
      });
  }, [sections]);

  const classOptions = useMemo(() => {
    const seen = new Map();
    tableData.forEach((r) => { if (r.classId && !seen.has(r.classId)) seen.set(r.classId, r.className); });
    return [...seen.entries()]
      .sort((a, b) => compareClassNames(a[1], b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [tableData]);

  const filteredData = useMemo(
    () => (classFilter ? tableData.filter((r) => r.classId === classFilter) : tableData),
    [tableData, classFilter]
  );

  const assignedCount = tableData.filter((r) => r.teacherId).length;
  const isAllAssigned = tableData.length > 0 && assignedCount === tableData.length;

  /* ───────── SAVE ───────── */
  const UNASSIGN = "__unassign__";

  const handleTeacherChange = async (value, record) => {
    const teacherId = value === UNASSIGN ? null : value;
    try {
      setSavingKey(record.key);

      await dispatch(
        assignClassTeacher({
          sectionId: record.sectionId,
          teacherId,
        })
      ).unwrap();

      message.success(
        teacherId
          ? `${record.className} - ${record.sectionName} updated`
          : `${record.className} - ${record.sectionName} teacher removed`
      );
    } catch (err) {
      const errorMessage =
        err?.message || err?.response?.data?.message || "Failed to assign teacher";
      message.error(errorMessage);
    } finally {
      setSavingKey(null);
    }
  };

  const TeacherPicker = ({ record, size = "middle" }) => {
    const selectedTeacher = users.find((u) => u._id === record.teacherId);
    return (
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {selectedTeacher ? (
          <Tag color="success" icon={<CheckCircleFilled />} style={{ width: "fit-content" }}>
            {selectedTeacher.name}
          </Tag>
        ) : (
          <span style={{ fontSize: 11, color: t.textSec, background: isDark ? "#1a1a1a" : "#f3f4f6", padding: "2px 8px", borderRadius: 99, width: "fit-content" }}>
            Not assigned
          </span>
        )}
        <Space size={6} style={{ width: "100%" }}>
          <Select
            placeholder="Select teacher…"
            value={record.teacherId || undefined}
            onChange={(val) => handleTeacherChange(val, record)}
            style={{ width: isMobile ? "100%" : 220 }}
            size={size}
            loading={savingKey === record.key}
            disabled={savingKey === record.key}
            showSearch
            optionFilterProp="children"
          >
            <Option value={UNASSIGN}>
              <span style={{ color: t.textSec }}>Not Selected</span>
            </Option>
            {users.map((u) => (
              <Option key={u._id} value={u._id}>
                {u.name}
              </Option>
            ))}
          </Select>
          {savingKey === record.key && <Spin size="small" />}
        </Space>
      </Space>
    );
  };

  /* ───────── COLUMNS ───────── */
  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      width: 120,
      render: (val) => <Tag color="geekblue">{val}</Tag>,
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      width: 100,
      render: (val) => <Tag color="purple">{val}</Tag>,
    },
    {
      title: "Class Teacher",
      render: (_, record) => <TeacherPicker record={record} size="small" />,
    },
  ];

  const handleFinish = () => {
    message.success("🎉 School setup completed successfully!");
    setTimeout(() => {
      next && next();
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Info bar — mirrors the "X of Y assigned" summary used in the Classes step */}
      <div
        style={{
          background: t.innerBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: t.accentBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TeamOutlined style={{ fontSize: 13, color: t.accent }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.textPri }}>
              Class Teacher Assignment
            </div>
            <div style={{ fontSize: 11.5, color: t.textSec }}>
              {assignedCount} of {tableData.length} sections assigned
            </div>
          </div>
        </div>

        <Select
          allowClear
          placeholder="Filter by class"
          style={{ width: 200 }}
          value={classFilter}
          onChange={setClassFilter}
          options={classOptions}
        />
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {loading && !tableData.length ? (
              [1, 2].map((i) => (
                <div key={i} style={{ padding: 14 }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))
            ) : filteredData.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: t.textSec }}>
                No sections found
              </div>
            ) : (
              filteredData.map((item) => (
                <div
                  key={item.key}
                  style={{
                    padding: 14,
                    borderBottom: `1px solid ${t.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <Space>
                    <Tag color="geekblue">{item.className}</Tag>
                    <Tag color="purple">{item.sectionName}</Tag>
                  </Space>
                  <TeacherPicker record={item} />
                </div>
              ))
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="key"
            pagination={false}
            loading={loading}
            locale={{
              emptyText: (
                <div style={{ padding: "32px 0" }}>No sections found</div>
              ),
            }}
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="primary"
          onClick={handleFinish}
          disabled={!isAllAssigned}
          style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
        >
          Finish Setup →
        </Button>
      </div>
    </div>
  );
};

export default SchoolClassSectionTeacher;

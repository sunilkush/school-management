import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Select, Button, message, Typography, Skeleton, Table, Tag } from "antd";
import {
  CheckOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { getAllSubjects } from "../../../features/subjectSlice";
import { addSubjectToSection } from "../../../features/sectionSlice";
import { useTheme } from "../../../context/ThemeContext";

const { Text } = Typography;

const tokens = (isDark) => ({
  cardBg: isDark ? "#141414" : "#ffffff",
  innerBg: isDark ? "#0f0f0f" : "#f8faff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  textPri: isDark ? "#e8e8e8" : "#111827",
  textSec: isDark ? "#6b7280" : "#9ca3af",
  accent: "#1677ff",
  thBg: isDark ? "#0f0f0f" : "#f9fafb",
});

const SchoolClassSubject = ({next}) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { schoolClasses = [], loading } = useSelector((s) => s.schoolClass || {});
  const { subjects = [] } = useSelector((s) => s.subject || {});
  const user = useSelector((s) => s.auth.user);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [mapping, setMapping] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(getAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (!schoolClasses.length) return;
    const initial = {};
    const savedState = {};
    schoolClasses.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        initial[sec._id] = sec.subjects?.map((s) => s._id) || [];
        if (sec.subjects?.length) savedState[sec._id] = true;
      });
    });
    setMapping(initial);
    setSaved(savedState);
  }, [schoolClasses]);

  const tableData = useMemo(
    () =>
      schoolClasses.flatMap((cls) =>
        (cls.sections || []).map((sec) => ({
          _id: sec._id,
          schoolClassId: cls._id,
          className: cls.name,
          sectionId: sec._id,
          sectionName: sec.name,
        }))
      ),
    [schoolClasses]
  );

  const filteredData = useMemo(
    () =>
      selectedClass
        ? tableData.filter((r) => r.schoolClassId === selectedClass)
        : tableData,
    [tableData, selectedClass]
  );

  const handleChange = useCallback((rowId, values) => {
    setMapping((p) => ({ ...p, [rowId]: values }));
    setSaved((p) => ({ ...p, [rowId]: false }));
  }, []);

  const handleSave = useCallback(
    async (record) => {
      setSaving((p) => ({ ...p, [record._id]: true }));
      try {
        await dispatch(
          addSubjectToSection({
            schoolClassId: record.schoolClassId,
            sectionId: record.sectionId,
            subjectIds: mapping[record._id] || [],
          })
        ).unwrap();
        message.success("Subjects saved");
        setSaved((p) => ({ ...p, [record._id]: true }));
      } catch (err) {
        message.error(err || "Failed to save");
      } finally {
        setSaving((p) => ({ ...p, [record._id]: false }));
      }
    },
    [dispatch, mapping]
  );

  const totalMapped = Object.values(mapping).filter((v) => v?.length > 0).length;

  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
      width: 150,
      render: (val) => (
        <Tag
          style={{
            fontWeight: 600,
            fontSize: 13,
            padding: "3px 12px",
            borderRadius: 6,
            background: isDark ? "#1a1a2e" : "#f0f4ff",
            color: isDark ? "#818cf8" : "#4338ca",
            border: "none",
          }}
        >
          {val}
        </Tag>
      ),
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      key: "sectionName",
      width: 130,
      render: (val) => (
        <Tag
          style={{
            fontSize: 13,
            padding: "3px 12px",
            borderRadius: 6,
            background: isDark ? "#0c1a2e" : "#e6f1ff",
            color: isDark ? "#60a5fa" : "#1d4ed8",
            border: "none",
            fontWeight: 500,
          }}
        >
          {val}
        </Tag>
      ),
    },
    {
      title: "Subjects",
      key: "subjects",
      render: (_, record) => {
        const selected = mapping[record._id] || [];
        return (
          <Select
            mode="multiple"
            style={{ width: "70%", minWidth: 240 }}
            value={selected}
            placeholder="Select subjects..."
            onChange={(val) => handleChange(record._id, val)}
            options={subjects.map((s) => ({
              label: s.name,
              value: s._id,
            }))}
          />
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 130,
      align: "center",
      render: (_, record) => (
        <Button
          type={saved[record._id] ? "default" : "primary"}
          icon={saved[record._id] ? <CheckOutlined /> : <SaveOutlined />}
          loading={saving[record._id]}
          onClick={() => handleSave(record)}
          style={
            saved[record._id]
              ? {
                  color: "#16a34a",
                  borderColor: "#86efac",
                  background: isDark ? "rgba(22,163,74,0.08)" : "#f0fdf4",
                  fontWeight: 500,
                }
              : { fontWeight: 500 }
          }
        >
          {saved[record._id] ? "Saved" : "Save"}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div
        style={{
          background: t.innerBg,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15, color: t.textPri }}>
            Subject Mapping
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {totalMapped} of {tableData.length} sections mapped
          </Text>
        </div>

        <Select
          placeholder="Filter by class"
          style={{ width: 180 }}
          allowClear
          onChange={setSelectedClass}
          value={selectedClass}
          options={schoolClasses.map((cls) => ({
            label: cls.name,
            value: cls._id,
          }))}
        />
      </div>

      {/* ANT DESIGN TABLE */}
      <Table
        rowKey="_id"
        dataSource={filteredData}
        columns={columns}
        loading={
          loading
            ? {
                indicator: (
                  <div style={{ padding: "12px 0" }}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </div>
                ),
              }
            : false
        }
        pagination={false}
        size="middle"
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${t.border}`,
        }}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "row-even" : "row-odd"
        }
        // eslint-disable-next-line no-unused-vars
        onRow={(record) => ({
          style: {
            background: isDark ? "#141414" : "#ffffff",
            transition: "background 0.2s",
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = isDark ? "#1a1a1a" : "#f0f7ff";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = isDark ? "#141414" : "#ffffff";
          },
        })}
      />
       {next && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="primary"
                  onClick={next}
                  disabled={!(SchoolClassSubject?.length > 0)}
                  style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
                >
                  Next: Teachers →
                </Button>
              </div>
            )}
    </div>
  );
};

export default SchoolClassSubject;
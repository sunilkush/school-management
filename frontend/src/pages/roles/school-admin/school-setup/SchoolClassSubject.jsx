import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Select,
  Button,
  message,
  Typography,
  Skeleton,
  Table,
  Tag,
  Grid,
} from "antd";
import { CheckOutlined, SaveOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchoolClasses } from "../../../../features/schoolClassSlice";
import { getAllSubjects } from "../../../../features/subjectSlice";
import { addSubjectToSection } from "../../../../features/sectionSlice";
import { useTheme } from "../../../../context/ThemeContext";

const { Text } = Typography;
const { useBreakpoint } = Grid;

const tokens = (isDark) => ({
  cardBg: isDark ? "#141414" : "#ffffff",
  innerBg: isDark ? "#0f0f0f" : "#f8faff",
  border: isDark ? "#1f1f1f" : "#f0f0f0",
  textPri: isDark ? "#e8e8e8" : "#111827",
  textSec: isDark ? "#6b7280" : "#9ca3af",
});

const SchoolClassSubject = ({ next }) => {
  const screens = useBreakpoint(); // ✅ FIXED (inside component)
  const isMobile = !screens.md;

  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { schoolClasses = [],  } = useSelector((s) => s.schoolClass || {});
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

  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: "Subjects",
      render: (_, record) => (
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          value={mapping[record._id] || []}
          onChange={(val) => handleChange(record._id, val)}
          options={subjects.map((s) => ({
            label: s.name,
            value: s._id,
          }))}
        />
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type={saved[record._id] ? "default" : "primary"}
          icon={saved[record._id] ? <CheckOutlined /> : <SaveOutlined />}
          loading={saving[record._id]}
          onClick={() => handleSave(record)}
        >
          {saved[record._id] ? "Saved" : "Save"}
        </Button>
      ),
    },
  ];

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      
      {/* FILTER */}
      <Select
        placeholder="Filter by class"
        allowClear
        onChange={setSelectedClass}
        style={{ width: 200 }}
        options={schoolClasses.map((cls) => ({
          label: cls.name,
          value: cls._id,
        }))}
      />

      {/* ✅ MOBILE CARD VIEW */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredData.map((item) => (
            <div key={item._id} style={{
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: 12,
              background: t.cardBg,
            }}>
              <div><b>Class:</b> {item.className}</div>
              <div><b>Section:</b> {item.sectionName}</div>

              <Select
                mode="multiple"
                style={{ width: "100%", marginTop: 8 }}
                value={mapping[item._id] || []}
                onChange={(val) => handleChange(item._id, val)}
                options={subjects.map((s) => ({
                  label: s.name,
                  value: s._id,
                }))}
              />

              <Button
                block
                style={{ marginTop: 10 }}
                onClick={() => handleSave(item)}
                loading={saving[item._id]}
              >
                Save
              </Button>
            </div>
          ))}
        </div>
      ) : (
        /* ✅ DESKTOP TABLE */
        <Table
          rowKey="_id"
          dataSource={filteredData}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* NEXT BUTTON */}
      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                 <Button
                   type="primary"
                   onClick={next}
                   disabled={!schoolClasses.length}
                   style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
                 >
          Next →
        </Button>
        </div>
      )}
    </div>
    </>
  );
};

export default SchoolClassSubject;
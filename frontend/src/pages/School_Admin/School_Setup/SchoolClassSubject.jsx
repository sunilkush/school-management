import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  Select,
  Table,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Empty,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { fetchAllSubjects } from "../../../features/subjectSlice";
import { addSubjectToSection } from "../../../features/sectionSlice";

const { Option } = Select;

const SchoolClassSubject = () => {
  const dispatch = useDispatch();

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );
  const { subjects = [] } = useSelector((state) => state.subject || {});
  const { user } = useSelector((state) => state.auth);
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [mapping, setMapping] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);

  // 🔥 Fetch (safe)
  useEffect(() => {
    if (!schoolId || !academicYearId) return;

    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId, academicYearId]);

  // 🔥 Pre-fill mapping (optimized)
  useEffect(() => {
    if (!schoolClasses.length) return;

    const initial = {};

    schoolClasses.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        initial[sec._id] =
          sec.sectionId?.subjects?.map((s) => s.subjectId) || [];
      });
    });

    setMapping(initial);
  }, [schoolClasses]);

  // 🔥 Subject Map (O(1) lookup instead of find)
  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      map[s._id] = s.name;
    });
    return map;
  }, [subjects]);

  // 🔥 Flatten data (memoized)
  const tableData = useMemo(() => {
    return schoolClasses.flatMap((cls) =>
      (cls.sections || []).map((sec) => ({
        _id: sec._id,
        schoolClassId: cls._id,
        className: cls.name,
        sectionId: sec.sectionId?._id,
        sectionName: sec.sectionId?.name,
      }))
    );
  }, [schoolClasses]);

  // 🔥 Filtered data (memoized)
  const filteredData = useMemo(() => {
    if (!selectedClass) return tableData;
    return tableData.filter((i) => i.schoolClassId === selectedClass);
  }, [tableData, selectedClass]);

  // 🔥 Change handler (stable)
  const handleChange = useCallback((rowId, values) => {
    setMapping((prev) => ({
      ...prev,
      [rowId]: values,
    }));
  }, []);

  // 🔥 Save handler (stable)
  const handleSave = useCallback(
    async (record) => {
      try {
        await dispatch(
          addSubjectToSection({
            schoolClassId: record.schoolClassId,
            sectionId: record.sectionId,
            subjectIds: mapping[record._id] || [],
          })
        ).unwrap();

        message.success("Saved ✅");
      } catch (err) {
        message.error(err || "Failed ❌");
      }
    },
    [dispatch, mapping]
  );

  // 🔥 Columns (memoized)
  const columns = useMemo(
    () => [
      { title: "Class", dataIndex: "className" },
      { title: "Section", dataIndex: "sectionName" },
      {
        title: "Subjects",
        render: (_, record) => (
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            value={mapping[record._id] || []}
            onChange={(val) => handleChange(record._id, val)}
            placeholder="Select Subject"
            options={subjects.map((s) => ({
              label: s.name,
              value: s._id,
            }))}
          />
        ),
      },
      {
        title: "Preview",
        render: (_, record) => (
          <Space wrap>
            {(mapping[record._id] || []).map((sid) => (
              <Tag key={sid}>{subjectMap[sid]}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: "Action",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            disabled={!mapping[record._id]?.length}
            onClick={() => handleSave(record)}
          >
            Save
          </Button>
        ),
      },
    ],
    [mapping, subjects, subjectMap, handleChange, handleSave]
  );

  return (
    <Card title="📚 Class - Section Subject Mapping">
      {/* Filter */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Select
            placeholder="Filter by Class"
            style={{ width: "100%" }}
            allowClear
            onChange={setSelectedClass}
            options={schoolClasses.map((cls) => ({
              label: cls.name,
              value: cls._id,
            }))}
          />
        </Col>
      </Row>

      <Divider />

      <Spin spinning={loading}>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="No Sections Found" />,
          }}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClassSubject;
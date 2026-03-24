import React, { useEffect, useState } from "react";
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

  const { subjects = [] } = useSelector(
    (state) => state.subject || {}
  );

  const [mapping, setMapping] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;

  // 🔹 Fetch
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSchoolClasses({ schoolId }));
    dispatch(fetchAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId]);

  // 🔥 Pre-fill mapping (IMPORTANT)
  useEffect(() => {
    const initial = {};

    schoolClasses.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        initial[sec._id] =
          sec.sectionId?.subjects?.map((s) => s.subjectId) || [];
      });
    });

    setMapping(initial);
  }, [schoolClasses]);

  // 🔥 Flatten
  const tableData = schoolClasses.flatMap((cls) =>
    (cls.sections || []).map((sec) => ({
      _id: sec._id,
      schoolClassId: cls._id,
      className: cls.name,
      sectionId: sec.sectionId?._id,
      sectionName: sec.sectionId?.name,
    }))
  );

  const filteredData = selectedClass
    ? tableData.filter((i) => i.schoolClassId === selectedClass)
    : tableData;

  // 🔹 Change
  const handleChange = (rowId, values) => {
    setMapping((prev) => ({
      ...prev,
      [rowId]: values,
    }));
  };

  // 🔥 Save
  const handleSave = async (record) => {
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
  };

  // 🔹 Columns
  const columns = [
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
          placeholder={'Select Subject'}
        >
          {subjects.map((sub) => (
            <Option key={sub._id} value={sub._id}>
              {sub.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Preview",
      render: (_, record) => (
        <Space wrap>
          {(mapping[record._id] || []).map((sid) => {
            const sub = subjects.find((s) => s._id === sid);
            return <Tag key={sid}>{sub?.name}</Tag>;
          })}
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
  ];

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
          >
            {schoolClasses.map((cls) => (
              <Option key={cls._id} value={cls._id}>
                {cls.name}
              </Option>
            ))}
          </Select>
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
            emptyText: (
              <Empty description="No Sections Found" />
            ),
          }}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClassSubject;
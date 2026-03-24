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

import { fetchSchoolClasses } from "../../../features/schoolClassSlice.js";
import { fetchAllSubjects } from "../../../features/subjectSlice.js";
import { addSubjectToSection } from "../../../features/sectionSlice.js";

const { Option } = Select;

const SchoolClassSubject = () => {
  const dispatch = useDispatch();

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );

  const { subjects = [] } = useSelector((state) => state.subject || {});

  const [mapping, setMapping] = useState({});
  const [selectedClass, setSelectedClass] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;

  // ==============================
  // 🔹 FETCH DATA
  // ==============================
  useEffect(() => {
    if (!schoolId) return;

    dispatch(fetchSchoolClasses({ schoolId }));
    dispatch(fetchAllSubjects({ isGlobal: true }));
  }, [dispatch, schoolId]);

  // ==============================
  // 🔥 FLATTEN DATA
  // ==============================
  const tableData = (schoolClasses || []).flatMap((cls) =>
    (cls.sections || []).map((sec) => ({
      _id: sec._id,
      schoolClassId: cls._id,
      className: cls.name,
      sectionId: sec.sectionId?._id,
      sectionName: sec.sectionId?.name,
    }))
  );

  // ==============================
  // 🔹 FILTER
  // ==============================
  const filteredData = selectedClass
    ? tableData.filter((item) => item.schoolClassId === selectedClass)
    : tableData;

  // ==============================
  // 🔹 UNIQUE CLASSES
  // ==============================
  const uniqueClasses = schoolClasses.map((cls) => ({
    _id: cls._id,
    name: cls.name,
  }));

  // ==============================
  // 🔹 HANDLE CHANGE
  // ==============================
  const handleChange = (rowId, values) => {
    setMapping((prev) => ({
      ...prev,
      [rowId]: values,
    }));
  };

  // ==============================
  // 🔥 SAVE (FIXED)
  // ==============================
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

      // refresh data
      dispatch(fetchSchoolClasses({ schoolId }));
    } catch (err) {
      message.error(err || "Save failed ❌");
    }
  };

  // ==============================
  // 🔹 COLUMNS
  // ==============================
  const columns = [
    {
      title: "Class",
      dataIndex: "className",
    },
    {
      title: "Section",
      dataIndex: "sectionName",
    },
    {
      title: "Subjects",
      render: (_, record) => (
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Select Subjects"
          value={mapping[record._id] || []}
          onChange={(val) => handleChange(record._id, val)}
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
            return (
              <Tag key={sid} color="blue">
                {sub?.name || "Unknown"}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          onClick={() => handleSave(record)}
          type="primary"
          size="small"
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="📚 Class - Section Subject Mapping"
      style={{ maxWidth: 1200, margin: "auto" }}
    >
      {/* FILTER */}
      <Card type="inner" title="Filter" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Select
              placeholder="Select Class"
              style={{ width: "100%" }}
              allowClear
              value={selectedClass}
              onChange={setSelectedClass}
            >
              {uniqueClasses.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Divider />

      <Spin spinning={loading}>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="No Data Found" />,
          }}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClassSubject;
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
  Form,
  Row,
  Col,
  Divider,
} from "antd";

const { Option } = Select;

const SchoolClassSubject = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);

  const schoolId = "123";

  // 🔹 Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);

      const [clsRes, secRes, subRes, mapRes] = await Promise.all([
        fetch("/api/classes"),
        fetch(`/api/sections/${schoolId}`),
        fetch("/api/subjects"),
        fetch(`/api/class-subjects/${schoolId}`),
      ]);

      const clsData = await clsRes.json();
      const secData = await secRes.json();
      const subData = await subRes.json();
      const mapData = await mapRes.json();

      setClasses(clsData.data || []);
      setSections(secData.data || []);
      setSubjects(subData.data || []);

      const grouped = {};
      (mapData.data || []).forEach((m) => {
        if (!grouped[m.sectionId]) grouped[m.sectionId] = [];
        grouped[m.sectionId].push(m.subjectId);
      });

      setMapping(grouped);
    } catch (err) {
      message.error("Failed to load data",err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Handle Subject Change
  const handleChange = (sectionId, values) => {
    setMapping({
      ...mapping,
      [sectionId]: values,
    });
  };

  // 🔹 Save Mapping
  const handleSave = async (sectionId) => {
    try {
      await fetch("/api/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          sectionId,
          subjectIds: mapping[sectionId] || [],
        }),
      });

      message.success("Subjects mapped successfully ✅");
    } catch {
      message.error("Failed to save");
    }
  };

  // 🔹 Bulk Save
  const handleBulkSave = async () => {
    try {
      setLoading(true);

      const payload = Object.keys(mapping).map((sectionId) => ({
        schoolId,
        sectionId,
        subjectIds: mapping[sectionId],
      }));

      await fetch("/api/class-subjects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      message.success("All mappings saved ✅");
    } catch {
      message.error("Bulk save failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filter Sections by Class
  const filteredSections = selectedClass
    ? sections.filter((sec) => sec.classId === selectedClass)
    : sections;

  // 🔹 Table Columns
  const columns = [
    {
      title: "Section",
      dataIndex: "name",
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
              <Tag color="blue" key={sid}>
                {sub?.name}
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
          type="primary"
          size="small"
          onClick={() => handleSave(record._id)}
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="📚 Class - Section Subject Mapping"
      extra={
        <Button type="primary" onClick={handleBulkSave}>
          Save All
        </Button>
      }
      style={{margin: "auto" }}
    >
      {/* 🔹 Form Filter */}
      <Card type="inner" title="Filter & Select" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Select
              placeholder="Select Class"
              style={{ width: "100%" }}
              allowClear
              value={selectedClass}
              onChange={setSelectedClass}
            >
              {classes.map((cls) => (
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
          dataSource={filteredSections}
          columns={columns}
          rowKey="_id"
          pagination={false}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClassSubject;

import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Popconfirm, message, Select, Row, Col, Card, Typography, Space } from "antd";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";
import * as XLSX from "xlsx";

const { Option } = Select;
const { Title, Text } = Typography;

const SubjectsAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");

  const dispatch = useDispatch();
  const { subjects = [], loading } = useSelector((state) => state.subject);
  const { schools = [] } = useSelector((state) => state.school);

  // Get logged-in user info
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const role = storedUser?.role?.name || "";

  // Fetch subjects on mount or when schoolId/role changes
  useEffect(() => {
    if (schoolId || role === "Super Admin") {
      dispatch(fetchAllSubjects({ schoolId: selectedSchool || schoolId }));
    }
  }, [dispatch, schoolId, role, selectedSchool]);

  // Role-based filter
  const filteredSubjects =
    role === "Super Admin"
      ? subjects
      : subjects.filter(
          (subj) =>
            subj.isGlobal === true ||
            String(subj.schoolId?._id || subj.schoolId) === String(schoolId)
        );

  // Local search
  const searchedSubjects = filteredSubjects.filter((subj) =>
    subj.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteSubject(id)).unwrap();
      message.success("Subject deleted");
      dispatch(fetchAllSubjects({ schoolId: selectedSchool || schoolId }));
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  const handleExport = () => {
    const exportData = filteredSubjects.map((s) => ({
      "Subject Name": s.name,
      Category: s.category || "—",
      Type: s.type || "—",
      "Max Marks": s.maxMarks ?? "—",
      "Pass Marks": s.passMarks ?? "—",
      Teacher: s.teacherId?.name || "Not Assigned",
      School: s.schoolId?.name || (s.isGlobal ? "Global" : "—"),
      Status: s.isActive ? "Active" : "Inactive",
      "Created Type": s.isGlobal ? "Global" : "School",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects");
    XLSX.writeFile(wb, "Subjects_List.xlsx");
  };

  const columns = [
    { title: "Subject Name", dataIndex: "name", key: "name", width: 180 },
    { title: "Category", dataIndex: "category", key: "category", width: 120 },
    { title: "Type", dataIndex: "type", key: "type", width: 100 },
    { title: "Max Marks", dataIndex: "maxMarks", key: "maxMarks", width: 100 },
    { title: "Pass Marks", dataIndex: "passMarks", key: "passMarks", width: 100 },
    { title: "Teacher", dataIndex: ["teacherId", "name"], key: "teacherId", width: 150, render: (value) => value || "Not Assigned" },
    { title: "School", key: "school", width: 160, render: (row) => (row.isGlobal ? <Tag color="blue">🌐 Global</Tag> : row.schoolId?.name) },
    { title: "Status", dataIndex: "isActive", key: "status", width: 120, render: (active) => active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> },
    { title: "Created Type", key: "createdType", width: 130, render: (row) => row.isGlobal ? <Tag color="blue">Global 🌐</Tag> : <Tag color="gray">School 🏫</Tag> },
    { title: "Actions", key: "actions", width: 150, render: (row) => (
      <div className="flex gap-2">
        <Button size="small" type="link" onClick={() => handleEdit(row)}>Edit</Button>
        <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(row._id)}>
          <Button size="small" type="link" danger>Delete</Button>
        </Popconfirm>
      </div>
    )}
  ];

  return (
    <>
      <SubjectForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
        }}
        editData={selectedSubject}
      />

      <Card>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col xs={24} md={12}>
            <Title level={4}>Subjects Management</Title>
            <Text type="secondary">Manage subjects for your school or global context.</Text>
          </Col>

          <Col xs={24} md={12}>
            <Space wrap>
              {role === "Super Admin" && (
                <Select
                  placeholder="Filter by School"
                  value={selectedSchool || undefined}
                  onChange={setSelectedSchool}
                  style={{ minWidth: 160 }}
                  allowClear
                >
                  {schools.map((s) => (
                    <Option key={s._id} value={s._id}>{s.name}</Option>
                  ))}
                </Select>
              )}
              <Input placeholder="Search subject..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 200 }} />
              <Button type="primary" danger onClick={handleExport}>Export Excel</Button>
              <Button type="primary" onClick={() => setIsModalOpen(true)}>+ Add New Subject</Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={searchedSubjects}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          style={{ marginTop: 16 }}
        />
      </Card>
    </>
  );
};

export default SubjectsAdmin;

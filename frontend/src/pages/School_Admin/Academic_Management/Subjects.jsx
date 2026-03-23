import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Button, Space, Modal, Input, Tooltip } from "antd";
import { Edit, Trash2 } from "lucide-react";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import { fetchAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";

const { Search } = Input;

const Subjects = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { subjects = [], loading = false } = useSelector(
    (state) => state.subject || {}
  );

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id;
  const role = storedUser?.role?.name || storedUser?.role;

  /* ================= FETCH ================= */
  useEffect(() => {
    if (role === "Super Admin" || schoolId) {
      dispatch(fetchAllSubjects({ schoolId }));
    }
  }, [dispatch, role, schoolId]);

  /* ================= SEARCH FILTER ================= */
  const filteredSubjects = subjects.filter((subj) =>
    subj.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  /* ================= ACTIONS ================= */
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Subject",
      content: "Are you sure you want to delete this subject?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        await dispatch(deleteSubject(id));
        dispatch(fetchAllSubjects({ schoolId }));
      },
    });
  };

  const handleAddNew = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Subject",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Type", dataIndex: "type", key: "type" },
    {
      title: "Max Marks",
      dataIndex: "maxMarks",
      key: "maxMarks",
      align: "center",
    },
    {
      title: "Pass Marks",
      dataIndex: "passMarks",
      key: "passMarks",
      align: "center",
    },
    {
      title: "Scope",
      key: "scope",
      render: (_, record) =>
        record.isGlobal ? (
          <Tag color="blue">🌐 Global</Tag>
        ) : (
          <Tag color="purple">{record.schoolId?.name || "School"}</Tag>
        ),
    },
    {
      title: "Teachers Assigned",
      key: "teachers",
      render: (_, record) =>
  record.schoolByAssignedTeachers?.some(
    (t) => String(t.schoolId) === String(schoolId)
  ) ? (
    <Space wrap>
      {record.schoolByAssignedTeachers
        .filter(
          (t) => String(t.schoolId) === String(schoolId)
        )
        .map((t, index) => (
          <Tooltip
            key={index}
            title={t.teacherId?.email || "No Email"}
          >
            <Tag color="cyan">
              {t.teacherId?.name || "Unknown"}
            </Tag>
          </Tooltip>
        ))}
    </Space>
  ) : (
    <span className="text-gray-400">—</span>
  ),
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            icon={<Trash2 size={16} />}
            danger
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <SubjectForm
        isOpen={isModalOpen}
        editData={selectedSubject}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
          dispatch(fetchAllSubjects({ schoolId }));
        }}
      />

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Subjects List
          </h2>
          <p className="text-sm text-gray-500">
            Manage subjects for your school or global context
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Search
            placeholder="Search subject..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
          <Button type="primary" onClick={handleAddNew}>
            + Add New Subject
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredSubjects}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </>
  );
};

export default Subjects;

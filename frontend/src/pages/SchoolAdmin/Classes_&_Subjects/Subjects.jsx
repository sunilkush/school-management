import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Button, Space, Modal, Input } from "antd";
import { Edit, Trash2 } from "lucide-react";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import { fetchAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";

const { Search } = Input;

const Subjects = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { subjects = [], loading = false } = useSelector((state) => state.subject || {});

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const role = storedUser?.role || "";

  // Fetch subjects
  useEffect(() => {
    if (schoolId) dispatch(fetchAllSubjects({ schoolId }));
  }, [dispatch, schoolId]);

  // Filter subjects by role and search
  const filteredSubjects = (subjects || []).filter((subj) => {
    const matchesRole =
      role === "Super Admin" || subj.isGlobal || String(subj.schoolId?._id || subj.schoolId) === String(schoolId);
    const matchesSearch = subj.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Handlers
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

  // Ant Design Columns
  const columns = [
    {
      title: "Subject",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text || "—"}</span>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => (a.category || "").localeCompare(b.category || ""),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
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
      render: (_, record) => (
        <span>{record.schoolId?.name || (record.isGlobal ? "🌐 Global" : "—")}</span>
      ),
    },
    {
      title: "Teachers Assigned",
      key: "teachers",
      render: (_, record) =>
        record.assignedTeachers?.length ? (
          <Space wrap>
            {record.assignedTeachers.map((t) => (
              <Tag key={t._id || t.name}>{t.name || t.fullName || t.teacherName}</Tag>
            ))}
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={record.isActive ? "green" : "red"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
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
      align: "center",
      width: 120,
    },
  ];

  return (
    <>
      {/* Modal for Add/Edit Subject */}
      <SubjectForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
          dispatch(fetchAllSubjects({ schoolId }));
        }}
        editData={selectedSubject}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Subjects List</h2>
          <p className="text-sm text-gray-500">
            Manage subjects for your school or global context.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Search
            placeholder="Search subject..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" onClick={handleAddNew}>
            + Add New Subject
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Table
          columns={columns}
          dataSource={filteredSubjects}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </>
  );
};

export default Subjects;

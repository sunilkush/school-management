import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllClasses as fetchClasses,
  deleteClass,
} from "../../../features/classSlice.js";

import { Edit, Trash2, Layers, X } from "lucide-react";
import { Table, Tag, Input, Button, Space, Modal } from "antd";
import ClassFormSA from "../../../components/forms/ClassSectionFormSA.jsx";

const { Search } = Input;

function Classes() {
  const dispatch = useDispatch();
  const { classList = [], loading } = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id || null;

  // Fetch classes
  useEffect(() => {
    if (schoolId) dispatch(fetchClasses({ schoolId }));
  }, [dispatch, schoolId]);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this class?",
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        await dispatch(deleteClass(id));
        dispatch(fetchClasses({ schoolId }));
      },
    });
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsOpen(true);
  };

  // Filtered classes
 const filteredItems = [...classList]  // copy to avoid mutating props/state
  .filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
  )
  .sort((a, b) => {
    // Extract number from "Class 1", "Class 10", etc.
    const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

  // Ant Design Table Columns
  const columns = [
    {
      title: "S.No",
      dataIndex: "serial",
      key: "serial",
      width: 70,
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: "Class Name",
      dataIndex: "name",
      key: "name",
      render: (t) => (
        <span className="flex items-center gap-2 font-semibold text-gray-800">
          <Layers size={16} className="text-blue-600" /> {t}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "inactive" ? (
          <Tag color="red">Inactive</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
    },
    {
      title: "School",
      dataIndex: "schoolId",
      key: "schoolId",
      render: (school) => school?.name || "—",
    },
    {
      title: "Academic Year",
      dataIndex: "academicYearId",
      key: "academicYearId",
      render: (year) => year?.name || "—",
    },
    {
      title: "Sections",
      dataIndex: "sections",
      key: "sections",
      render: (sections) =>
        sections?.length ? (
          <Space wrap>
            {sections.map((s) => (
              <Tag key={s._id} color="blue">
                {s.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="text-gray-400">No Sections</span>
        ),
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      key: "subjects",
      render: (subjects) =>
        subjects?.length ? (
          <Space wrap>
            {subjects.map((sub) => (
              <Tag key={sub._id} color="purple">
                {sub?.subjectId?.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <span className="text-gray-400">No Subjects</span>
        ),
    },
    {
      title: "Class Teacher",
      dataIndex: "teacherId",
      key: "teacherId",
      render: (teacher) => teacher?.name || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, cls) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(cls)}
          />
          <Button
            type="link"
            icon={<Trash2 size={16} />}
            danger
            onClick={() => handleDelete(cls._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Modal for Add/Edit */}
      <Modal
        title={editingClass ? "Edit Class" : "Add New Class"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        destroyOnClose
      >
        <ClassFormSA
          onClose={() => setIsOpen(false)}
          initialData={editingClass}
          onSuccess={() => {
            dispatch(fetchClasses({ schoolId }));
            setIsOpen(false);
          }}
        />
      </Modal>

      {/* Main Container */}
      <div className="bg-white p-6 rounded-xl shadow border w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-3">
          <h4 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="text-blue-600" size={20} /> Class Management
          </h4>

          <Button type="primary" onClick={handleAddNew}>
            + Add New Class
          </Button>
        </div>

        <div className="mb-4 md:w-1/3">
          <Search
            placeholder="Search class..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      </div>
    </>
  );
}

export default Classes;

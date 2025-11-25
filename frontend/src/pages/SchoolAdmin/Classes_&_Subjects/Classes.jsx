import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllClasses as fetchClasses,
  deleteClass,
} from "../../../features/classSlice.js";

import { Edit, Trash2, Layers } from "lucide-react";
import { Table, Tag } from "antd";
import ClassFormSA from "../../../components/forms/ClassSectionFormSA.jsx";

function Classes() {
  const dispatch = useDispatch();
  const { classList = [], loading } = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id || null;

  useEffect(() => {
    if (schoolId) dispatch(fetchClasses({ schoolId }));
  }, [dispatch, schoolId]);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      await dispatch(deleteClass(id));
      dispatch(fetchClasses({ schoolId }));
    }
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsOpen(true);
  };

  const filteredItems = classList.filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
  );

  // 🔥 Ant Design Table Columns
  const columns = [
    {
      title: "Serial",
      dataIndex: "serial",
      key: "serial",
      width: 80,
      render: (t) => <span className="font-medium">{t}</span>,
    },
    {
      title: "Class Name",
      dataIndex: "name",
      key: "name",
      render: (t) => (
        <span className="font-semibold text-gray-800 flex items-center gap-1">
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
          sections.map((s) => (
            <Tag key={s._id} color="blue">
              {s.name}
            </Tag>
          ))
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
          subjects.map((sub) => (
            <Tag key={sub._id} color="purple">
              {sub?.subjectId?.name}
            </Tag>
          ))
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
        <div className="flex gap-3">
          <button
            onClick={() => handleEdit(cls)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(cls._id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xs"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            <ClassFormSA
              onClose={() => setIsOpen(false)}
              initialData={editingClass}
              onSuccess={() => {
                dispatch(fetchClasses({ schoolId }));
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full bg-white p-6 rounded-xl shadow border">
        <div className="flex flex-col md:flex-row justify-between items-center mb-5 gap-3">
          <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="text-blue-600" size={20} /> Class Management
          </h4>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Add New Class
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search class..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* TABLE 🔥 */}
        <Table
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
        />
      </div>
    </>
  );
}

export default Classes;

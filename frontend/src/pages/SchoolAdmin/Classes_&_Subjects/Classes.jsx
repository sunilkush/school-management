import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchClassSections,
  deleteClassSection,
} from "../../../features/classSectionSlice";
import DataTable from "react-data-table-component";
import { Edit, Trash2 } from "lucide-react";

import ClassSectionFormSA from "../../../components/forms/ClassSectionFormSA";

function Classes() {
  const dispatch = useDispatch();

  // ensure classList is always an array
  const { mappings = [], loading } = useSelector((state) => state.classSection || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");
  const schoolId = user?.school?._id || null;
  // Fetch only classes from the user's school
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchClassSections({ schoolId })); // ✅ pass as object
    }
  }, [dispatch, schoolId]);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      await dispatch(deleteClassSection(id));
      if (schoolId) {
        dispatch(fetchClassSections({ schoolId })); // ✅ pass as object
      }
    }
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsOpen(true);
  };

  // Columns for DataTable
  const columns = [
    {
      name: "Class Name",
      selector: (row) => row.class?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
          {row.class?.name || "—"}
        </span>
      ),
    },
    {
      name: "Section",
      selector: (row) => row.section?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-md">
          {row.section?.name || "—"}
        </span>
      ),
    },
    {
      name: "Subjects",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 py-1">
          {row.subjects?.map((sub, idx) => (
            <span
              key={sub.subjectId?._id || idx}
              className="px-2 py-1 text-xs bg-gray-200 rounded-md"
            >
              {sub.subjectId?.name || "—"} ({sub.teacherId?.name || "—"})
            </span>
          ))}
        </div>
      ),
    },
    {
      name: "Class Teacher",
      selector: (row) => row.classTeacher?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
          {row.classTeacher?.name || "—"}
        </span>
      ),
    },
    {
      name: "School",
      selector: (row) => row.school?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
          {row.school?.name || "—"}
        </span>
      ),
    },
    {
      name: "Academic Year",
      selector: (row) => row.academicYear?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
          {row.academicYear?.name || "—"}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];


  // Show only classes for this school
  const schoolClasses = mappings.filter(
   (cls) => String(cls.school?._id) === String(user?.school?._id)
 );

  // Apply search filter
  const filteredItems = schoolClasses.filter(
   (item) =>
    item.class?.name?.toLowerCase().includes(filterText.toLowerCase()) ||
     item.section?.name?.toLowerCase().includes(filterText.toLowerCase())
);

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
            <ClassSectionFormSA
              onClose={() => setIsOpen(false)}
              initialData={editingClass}
              onSuccess={() => {
                if (schoolId) dispatch(fetchClassSections({ schoolId })); // refresh table
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="w-full bg-white p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-xl font-bold">Class List</h4>
          <button
            onClick={handleAddNew}
            className="px-3 py-2 text-xs bg-blue-600 rounded-lg text-white hover:bg-blue-700"
          >
            Add New Class
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Class or Section..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border rounded-lg text-xs"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredItems}
          progressPending={loading}
          pagination
          highlightOnHover
          pointerOnHover
          responsive
        />
      </div>
    </>
  );
}

export default Classes;

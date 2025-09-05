import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllClasses,
  deleteClass,
} from "../features/classes/classSlice";
import DataTable from "react-data-table-component";
import { Edit, Trash2 } from "lucide-react";
import ManageClassSection from "../components/forms/ManageClassSection";

function Classes() {
  const dispatch = useDispatch();

  // ensure classList is always an array
  const { classList = [], loading } = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");

  // Fetch only classes from the user's school
  useEffect(() => {
    if (user?.school?._id) {
      dispatch(fetchAllClasses({ schoolId: user.school._id }));
    }
  }, [dispatch, user]);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      await dispatch(deleteClass(id));
      if (user?.school?._id) {
        dispatch(fetchAllClasses({ schoolId: user.school._id })); // refresh after delete
      }
    }
  };

  const handleAddNew = () => {
    setEditingClass(null);
    setIsOpen(true);
  };

  // Columns for DataTable
  const columns = [
    { name: "Class Name", selector: (row) => row.name, sortable: true },
    { name: "Section", selector: (row) => row.section, sortable: true },
    {
      name: "Subjects",
      cell: (row) => (
        <div className="flex flex-wrap gap-1 py-1">
          {row.subjects?.map((sub, idx) => (
            <span
              key={sub._id || idx}
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
      selector: (row) => row.teacherId?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
          {row.teacherId?.name || "—"}
        </span>
      ),
    },
    {
      name: "School",
      selector: (row) => row.schoolId?.name || "—",
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
          {row.schoolId?.name || "—"}
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
  const schoolClasses = classList.filter(
    (cls) => String(cls.schoolId?._id) === String(user?.school?._id)
  );
  
  // Apply search filter
  const filteredItems = schoolClasses.filter(
    (item) =>
      item.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      item.section?.toLowerCase().includes(filterText.toLowerCase())
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
            <ManageClassSection
              onClose={() => setIsOpen(false)}
              initialData={editingClass}
              onSuccess={() => {
                if (user?.school?._id) {
                  dispatch(fetchAllClasses({ schoolId: user.school._id }));
                }
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

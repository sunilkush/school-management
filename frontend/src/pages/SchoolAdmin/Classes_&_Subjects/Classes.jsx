import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
 fetchAllClasses as fetchClasses,
  deleteClass,
} from "../../../features/classSlice.js";
import DataTable from "react-data-table-component";
import { Edit, Trash2 } from "lucide-react";
import ClassFormSA from "../../../components/forms/ClassSectionFormSA.jsx";

function Classes() {
  const dispatch = useDispatch();
  const { classList = [], loading } = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id || null;

  // ✅ Fetch Classes
  useEffect(() => {
    dispatch(fetchClasses({ schoolId }));
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

  // ✅ Columns
 // ✅ Columns
const columns = [
  {
    name: "Class",
    selector: (row) => row.name || "—",
    sortable: true,
    cell: (row) => (
      <div>
        <span className="px-2 py-1 text-xs bg-gray-100 rounded-md">
          {row.name || "—"}
        </span>
        {row.code && (
          <span className="ml-2 px-2 py-1 text-[10px] bg-gray-200 text-gray-700 rounded-md">
            {row.code}
          </span>
        )}
      </div>
    ),
  },
  {
    name: "Sections",
    cell: (row) =>
      row.sections?.length ? (
        <div className="flex flex-wrap gap-1 py-1">
          {row.sections.map((s, idx) => (
            <span
              key={s.sectionId?._id || idx}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-md"
            >
              {s.name || "—"}
             
            </span>
          ))}
        </div>
      ) : (
        "—"
      ),
  },
  {
    name: "Class Teacher",
    selector: (row) => row.teacherId?.name || "—",
    cell: (row) => (
      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
        {row.teacherId?.name || "—"}
      </span>
    ),
  },
  {
    name: "Subjects",
    cell: (row) =>
      row.subjects?.length ? (
        <div className="flex flex-wrap gap-1 py-1">
          {row.subjects.map((sub, idx) => (
            <span
              key={sub.subjectId?._id || idx}
              className="px-2 py-1 text-xs bg-gray-200 rounded-md"
            >
              {sub.subjectId?.name || "—"}{" "}
              {sub.subjectId?.code && (
                <span className="text-[10px] text-gray-700">
                  ({sub.subjectId.code})
                </span>
              )}{" "}
              ({sub.teacherId?.name || "—"})
            </span>
          ))}
        </div>
      ) : (
        "—"
      ),
  },
  {
    name: "School",
    selector: (row) => row.schoolId?.name || (row.isGlobal ? "🌍 Global" : "—"),
    sortable: true,
    cell: (row) => (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-md">
        {row.isGlobal ? "🌍 Global" : row.schoolId?.name || "—"}
      </span>
    ),
  },
  {
    name: "Academic Year",
    selector: (row) => row.academicYearId?.name || "—",
    sortable: true,
    cell: (row) => (
      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
        {row.academicYearId?.name || "—"}
      </span>
    ),
  },
  {
    name: "Status",
    selector: (row) => row.status || "active",
    cell: (row) => (
      <span
        className={`px-2 py-1 text-xs rounded-md ${
          row.status === "inactive"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {row.status}
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


  // ✅ Search Filter
  const filteredItems = classList.filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
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

      {/* Table */}
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
            placeholder="Search by Class..."
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

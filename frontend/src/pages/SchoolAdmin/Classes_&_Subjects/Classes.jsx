import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllClasses as fetchClasses,
  deleteClass,
} from "../../../features/classSlice.js";
import { Edit, Trash2, Layers, BookOpen, User, Calendar } from "lucide-react";
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

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search class..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No classes found. Try adding one.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((cls) => (
              <div
                key={cls._id}
                className="border rounded-xl shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-gray-50 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Serial + Class Name */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-sm text-gray-500 mr-1">{cls.serial}.</span>
                      <Layers size={18} className="text-blue-600" />
                      {cls.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${cls.status === "inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                        }`}
                    >
                      {cls.status}
                    </span>
                  </div>

                  {/* School Name */}
                  <div className="flex items-center text-xs text-gray-600 mb-2">
                    <User size={14} className="mr-1 text-blue-600" />
                    {cls.schoolId?.name || "—"}
                  </div>

                  {/* Academic Year */}
                  <div className="flex items-center text-xs text-gray-600 mb-3">
                    <Calendar size={14} className="mr-1 text-blue-600" />
                    {cls.academicYearId?.name || "—"}
                  </div>

                  {/* Sections */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Sections:</p>
                    {cls.sections?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {cls.sections.map((s) => (
                          <span
                            key={s._id}
                            className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No Sections</span>
                    )}
                  </div>

                  {/* Subjects */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
                    {cls.subjectDetails?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {cls.subjectDetails.map((sub) => (
                          <span
                            key={sub._id}
                            className="px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded-md"
                          >
                            <BookOpen
                              size={12}
                              className="inline mr-1 text-gray-500"
                            />
                            {sub.name}
                            {sub.code && (
                              <span className="text-[10px] text-gray-500 ml-1">
                                ({sub.code})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No Subjects</span>
                    )}
                  </div>

                  {/* Class Teacher */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Class Teacher:
                    </p>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {cls.teacherId?.name || "—"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4 border-t pt-3">
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
              </div>

            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Classes;

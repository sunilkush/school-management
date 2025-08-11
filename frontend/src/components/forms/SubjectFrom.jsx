import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../features/auth/authSlice";
import {
  createSubject,
  updateSubject,
  fetchAllSubjects
} from "../../features/subject/subjectSlice";

const SubjectForm = ({ editData, onClose }) => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.auth);

  // Instant load from localStorage to prevent flashing
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const academicYearData = JSON.parse(localStorage.getItem("selectedAcademicYear") || "{}");
  const academicYearId = academicYearData?._id || "";

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    schoolId,
    academicYearId
  });

  // Pre-fill for edit
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        teacherId: editData.teacherId || "",
        schoolId: editData.schoolId?._id || schoolId,
        academicYearId: editData.academicYearId || academicYearId
      });
    }
  }, [editData, schoolId, academicYearId]);

  const subjectList = ["English", "Science", "History", "Mathematics", "Physics"];

  const teachers = Array.isArray(users)
    ? users.filter((u) => u?.role?.name === "Teacher" && u?.school?._id === schoolId)
    : [];

  useEffect(() => {
    if (!users.length) {
      dispatch(fetchAllUser());
    }
  }, [dispatch, users.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.schoolId || !formData.academicYearId) {
      alert("School ID or Academic Year is missing");
      return;
    }

    const action = editData
      ? updateSubject({ subjectId: editData._id, subjectData: formData })
      : createSubject(formData);

    dispatch(action).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        dispatch(fetchAllSubjects());
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">
          {editData ? "Update Subject" : "Create Subject"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Name */}
          <div>
            <label className="block mb-1 font-medium">Subject Name</label>
            <select
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Subject</option>
              {subjectList.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block mb-1 font-medium">Assign Teacher</label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Teacher</option>
              {teachers.length > 0 ? (
                teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))
              ) : (
                <option disabled>No teachers available</option>
              )}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;

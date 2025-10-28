import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSubject, updateSubject } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { Button } from "@/components/ui/button";

const SubjectForm = ({ isOpen, onClose, editData = null }) => {
  const dispatch = useDispatch();
  const { users = [], user } = useSelector((state) => state.auth);
  const { loading, successMessage, error } = useSelector((state) => state.subject);
  const { activeYear } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id || "";
  const roleName = user?.role?.name || "";

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    assignedTeachers: [],
    schoolId: schoolId || "",
    academicYearId: activeYear?._id || "",
    maxMarks: "",
    passMarks: "",
    isActive: true,
    createdByRole: roleName || "",
  });

  // ✅ Pre-fill data when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        category: editData.category || "",
        type: editData.type || "",
        assignedTeachers: editData.assignedTeachers?.map(t => t._id) || [],
        schoolId: editData.schoolId?._id || schoolId,
        academicYearId: editData.academicYearId?._id || activeYear?._id || "",
        maxMarks: editData.maxMarks || "",
        passMarks: editData.passMarks || "",
        isActive: editData.isActive ?? true,
        createdByRole: roleName || "",
      });
    }
  }, [editData, schoolId, activeYear,roleName]);

  // ✅ Fetch teachers and active academic year
  useEffect(() => {
    if (roleName === "School Admin" && schoolId) {
      dispatch(fetchAllUser({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, roleName, schoolId]);

  // ✅ Update academic year when fetched
  useEffect(() => {
    if (activeYear?._id) {
      setFormData((prev) => ({
        ...prev,
        academicYearId: activeYear._id,
      }));
    }
  }, [activeYear]);

  // ✅ Filter only teacher users
  const teachers = users?.filter((u) => u.role?.name?.toLowerCase() === "teacher");

  // ✅ Subject name options (for Super Admin)
  const SubjectList = [
    "English", "Science", "History", "Geography", "Art", "Physical Education",
    "Computer Science", "Music", "Economics", "Psychology", "Sociology",
    "Political Science", "Philosophy", "Biology", "Chemistry", "Physics",
    "Mathematics", "Business Studies", "Accounting", "Statistics",
    "Environmental Science", "Information Technology", "Data Science",
    "Artificial Intelligence", "Web Development", "Graphic Design",
    "Digital Marketing", "Project Management", "Finance", "Marketing",
    "Animation", "Music Production", "Film Studies", "Creative Writing",
    "Social Work"
  ];

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value, options, multiple } = e.target;
    if (multiple) {
      const selected = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, [name]: selected }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = { ...formData };

    if (roleName === "Super Admin") {
      payload.isGlobal = true;
      delete payload.schoolId;
      delete payload.academicYearId;
    } else {
      payload.isGlobal = false;
      payload.schoolId = schoolId;
      payload.academicYearId = activeYear?._id;
    }

    if (!payload.name || !payload.category || !payload.type) {
      alert("Please fill all required fields.");
      return;
    }

    if (editData?._id) {
      dispatch(updateSubject({ subjectId: editData._id, subjectData: payload }));
    } else {
      dispatch(createSubject(payload));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-6 relative">
        {/* ❌ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>

        {/* 🧩 Title */}
        <h2 className="text-xl font-bold mb-4">
          {editData
            ? "Edit Subject"
            : roleName === "Super Admin"
            ? "Create Global Subject"
            : "Create School Subject"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}

        {/* 🧾 FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {/* Subject Name */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">Subject Name</label>
            {roleName === "Super Admin" ? (
              <select
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-2 py-2 text-xs"
                required
              >
                <option value="">Select Subject</option>
                {SubjectList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 text-xs"
                placeholder="Enter subject name (e.g. Moral Science)"
                required
              />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-xs"
              required
            >
              <option value="">Select Category</option>
              {["Core", "Elective", "Language", "Practical", "Optional"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-xs"
              required
            >
              <option value="">Select Type</option>
              {["Theory", "Practical", "Both"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-xs font-medium mb-1">Max Marks</label>
            <input
              type="number"
              name="maxMarks"
              value={formData.maxMarks}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-xs"
              placeholder="e.g. 100"
            />
          </div>

          {/* Pass Marks */}
          <div>
            <label className="block text-xs font-medium mb-1">Pass Marks</label>
            <input
              type="number"
              name="passMarks"
              value={formData.passMarks}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 text-xs"
              placeholder="e.g. 33"
            />
          </div>

          {/* Multi Assign Teachers */}
          {roleName === "School Admin" && (
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Assign Teachers (Multiple)</label>
              <select
                name="assignedTeachers"
                multiple
                value={formData.assignedTeachers}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 text-xs h-28"
              >
                {teachers?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple teachers
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 col-span-2 mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
            <Button type="submit" disabled={loading} className="text-xs">
              {loading
                ? "Saving..."
                : editData
                ? "Update Subject"
                : "Create Subject"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;

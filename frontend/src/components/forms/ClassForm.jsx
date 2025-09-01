import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUser } from "../../features/auth/authSlice";
import { fetchAllSubjects } from "../../features/subject/subjectSlice";
import { createClass, updateClass } from "../../features/classes/classSlice";
import "primereact/resources/themes/lara-light-cyan/theme.css";

const ClassForm = ({ onClose, initialData }) => {
  const dispatch = useDispatch();

  const { subjectList = [] } = useSelector((state) => state.subject || {});
  const { loading, error, success } = useSelector((state) => state.class || {});
  const { user, users = [] } = useSelector((state) => state.auth || {});
  const storedAcademicYear = localStorage.getItem("academicYear");
  const academicYear = storedAcademicYear ? JSON.parse(storedAcademicYear) : null;
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    teacherId: "",
    subjects: [], // { subjectId, teacherId }
    schoolId: user?.school?._id || "",
    academicYearId: academicYear?._id || "",
  });

  // ✅ Prefill form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        section: initialData.section || "",
        teacherId: initialData.teacherId?._id || "",
        subjects:
          initialData.subjects?.map((s) => ({
            subjectId: s.subjectId?._id || s.subjectId || "",
            teacherId: s.teacherId?._id || "",
          })) || [],
        schoolId: initialData.schoolId?._id || user?.school?._id || "",
        academicYearId:
          initialData.academicYearId?._id ||
          user?.academicYear?._id ||
          "",
      });
    }
  }, [initialData, user]);

  // Load teachers + subjects
  useEffect(() => {
    if (user?.school?._id ) {
      dispatch(fetchAllUser(user.school._id));
      dispatch(
        fetchAllSubjects({
          schoolId: user.school._id
        })
      );
    }
  }, [dispatch, user]);

  // 👇 Teachers filter
  const teachersToShow = users.filter(
    (t) =>
      t.role?.name === "Teacher" &&
      String(t.school?._id) === String(user?.school?._id)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Subject teacher mapping
  const handleSubjectChange = (subjectId, teacherId) => {
    setFormData((prev) => {
      const updatedSubjects = prev.subjects.filter(
        (s) => String(s.subjectId) !== String(subjectId)
      );
      if (teacherId) {
        updatedSubjects.push({ subjectId, teacherId });
      }
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?._id) {
        await dispatch(
          updateClass({ id: initialData._id, classData: formData })
        );
      } else {
        await dispatch(createClass(formData));
      }
      onClose();
    } catch (err) {
      console.error("Dispatch error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-2xl font-bold mb-2">
        {initialData ? "Edit Class" : "Add Class"}
      </h2>

      {success && (
        <div className="bg-green-100 text-green-800 p-3 mb-4">{success}</div>
      )}
      {error && <div className="bg-red-100 text-red-800 p-3 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class Name */}
        <div>
          <label className="block mb-1 text-xs">Class Name</label>
          <select
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border px-2 py-1 w-full rounded-lg text-sm"
            required
          >
            <option value="">Select Class</option>
            {[
              "1st",
              "2nd",
              "3rd",
              "4th",
              "5th",
              "6th",
              "7th",
              "8th",
              "9th",
              "10th",
              "11th",
              "12th",
            ].map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block mb-1 text-xs">Section</label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
            className="border px-2 py-1 w-full rounded-lg text-sm"
            required
          >
            <option value="">Select Section</option>
            {["A", "B", "C", "D", "E", "F"].map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Class Teacher */}
        <div>
          <label className="block mb-1 text-xs">Class Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="border px-2 py-1 w-full rounded-lg text-sm"
            required
          >
            <option value="">Select Teacher</option>
            {teachersToShow.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subjects + Teacher Mapping */}
        <div className="col-span-2">
          <label className="block mb-2 text-xs">Subjects & Teachers</label>
          {subjectList.map((sub) => {
            const selected = formData.subjects.find(
              (s) => String(s.subjectId) === String(sub._id)
            );
            return (
              <div
                key={sub._id}
                className="flex items-center gap-4 mb-2 border p-2 rounded"
              >
                <span className="w-1/3">{sub.name}</span>
                <select
                  value={selected?.teacherId || ""}
                  onChange={(e) =>
                    handleSubjectChange(sub._id, e.target.value)
                  }
                  className="border px-2 py-1 w-2/3 rounded-lg"
                >
                  <option value="">Assign Teacher</option>
                  {teachersToShow.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          className="px-2 py-1 bg-gray-300 rounded-md text-sm"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : initialData
            ? "Update Class"
            : "Create Class"}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;

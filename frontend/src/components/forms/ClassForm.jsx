import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUser } from "../../features/auth/authSlice";
import { fetchAllSubjects } from "../../features/subject/subjectSlice";
import { createClass, updateClass } from "../../features/classes/classSlice";
import { MultiSelect } from "primereact/multiselect";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Link } from "react-router-dom";

const ClassForm = ({ teacherList = [], onClose, initialData }) => {
  
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.auth);
  const { subjectList = [] } = useSelector((state) => state.subject || {});
  const { loading,  error,success } =
    useSelector((state) => state.class || {});

  const [selectedSubjects, setSelectedSubjects] = useState([]);
 

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    teacherId: "",
    subjects: [],
    schoolId: JSON.parse(localStorage.getItem("user"))?.school?._id || "",
  });

  // ✅ Prefill form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        section: initialData.section || "",
        teacherId: initialData.teacherId?._id || "",
        subjects: initialData.subjects?.map((s) => s._id) || [],
        schoolId: initialData.schoolId || JSON.parse(localStorage.getItem("user"))?.school?._id || "",
      });
      setSelectedSubjects(initialData.subjects || []);
    }
  }, [initialData]);

  // Load teachers + subjects
  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchAllSubjects());
  }, [dispatch]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedSubjectIds = selectedSubjects.map((sub) => sub._id);

   

    try {
      const dataToSubmit = {
        ...formData,
        subjects: selectedSubjectIds,
      };

      if (initialData?._id) {
        await dispatch(updateClass({ id: initialData._id, classData: dataToSubmit }));
      } else {
        await dispatch(createClass(dataToSubmit));
      }

      onClose();
    } catch (err) {
      console.error("Dispatch error:", err);
    }
  };

  const teachersToShow = teacherList.length ? teacherList : users;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-2xl font-bold mb-2">
        {initialData ? "Edit Class" : "Add Class"}
      </h2>

      {success && <div className="bg-green-100 text-green-800 p-3 mb-4">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-3 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class Name */}
        <div>
          <label className="block mb-1 text-xs">Class Name</label>
          <select
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg"
            required
          >
            <option value="">Select Class</option>
            {["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"].map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
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
            className="border px-2 py-2 w-full rounded-lg"
            required
          >
            <option value="">Select Section</option>
            {["A","B","C","D","E","F"].map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Subjects */}
        <div>
          <label className="block mb-1 text-xs">Subjects</label>
          <MultiSelect
            value={selectedSubjects}
            onChange={(e) => setSelectedSubjects(e.value)}
            options={subjectList}
            optionLabel="name"
            placeholder="Select Subjects"
            display="chip"
            className="w-full border rounded-lg"
          />
          <Link className="text-xs text-red-500" to="/dashboard/schooladmin/subjects">
            Create new subject
          </Link>
        </div>

        {/* Teacher */}
        <div>
          <label className="block mb-1 text-xs">Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg"
            required
          >
            <option value="">Select Teacher</option>
            {teachersToShow
              .filter((t) => t.role?.name === "Teacher")
              .map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button type="button" className="px-4 py-2 bg-gray-300 rounded-lg" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Saving..." : initialData ? "Update Class" : "Create Class"}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;

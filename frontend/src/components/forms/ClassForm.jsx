import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllUser } from '../../features/auth/authSlice';
import { fetchAllSubjects } from '../../features/subject/subjectSlice';
import { createClass } from '../../features/classes/classSlice';
import { MultiSelect } from 'primereact/multiselect';
//import "primereact/resources/themes/lara-light-cyan/theme.css";
const ClassForm = ({ teacherList = [] }) => {
  const dispatch = useDispatch();

  const { users = [] } = useSelector((state) => state.auth);
  const { subjectList = [] } = useSelector((state) => state.subject || {});
  const classState = useSelector((state) => state.class || {});
  const { loading, success, error: createError } = classState;

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    section: '',
    teacherId: '',
    subjects: [],
    schoolId: JSON.parse(localStorage.getItem('user'))?.school?._id || '',
  });

  const classList = [
    '1st', '2nd', '3rd', '4th', '5th', '6th',
    '7th', '8th', '9th', '10th', '11th', '12th',
  ];

  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  // ✅ Show message based on Redux state
  useEffect(() => {
    if (success) {
      setMessage("Class created successfully!");
      setError("");
      setSelectedSubjects([]);
      setFormData((prev) => ({
        ...prev,
        name: '',
        section: '',
        teacherId: '',
        subjects: [],
      }));
      setTimeout(() => setMessage(""), 3000);
    }
    if (createError) {
      setError(createError);
      setMessage("");
    }
  }, [success, createError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedSubjectIds = selectedSubjects.map((sub) => sub._id);

    if (
      !formData.name ||
      !formData.section ||
      !formData.teacherId ||
      selectedSubjectIds.length === 0
    ) {
     setTimeout(()=>{
       setError("Please fill in all required fields.");
      setMessage("");
     },3000)
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        subjects: selectedSubjectIds,
      };

      await dispatch(createClass(dataToSubmit));
    } catch (err) {
      console.error("Dispatch error:", err);
    }
  };

  const teachersToShow = teacherList.length ? teacherList : users;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold">Add Class</h2>
      <p className="text-gray-600">Please fill in the details below to create a new class.</p>

      {message && (
        <div className="bg-green-100 text-green-800 border border-green-300 rounded p-3 mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-300 rounded p-3 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* Class Name */}
        <div>
          <label className="block mb-1">Class Name</label>
          <select
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg border-gray-400"
            required
          >
            <option value="">Select Class</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block mb-1">Class Section</label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg border-gray-400"
            required
          >
            <option value="">Select Section</option>
            {['A', 'B', 'C', 'D'].map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-md font-medium text-gray-700 mb-1">
            Select Subjects
          </label>
          <MultiSelect
            value={selectedSubjects}
            onChange={(e) => setSelectedSubjects(e.value)}
            options={subjectList}
            optionLabel="name"
            placeholder="Select Subjects"
            className="border px-2 pt-0 w-full rounded-lg border-gray-400"
            display="chip"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple
          </p>
        </div>

        {/* Teacher */}
        <div>
          <label className="block mb-1">Select Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg border-gray-400"
            required
          >
            <option value="">Select Teacher</option>
            {teachersToShow
              .filter(
                (t) =>
                  t.role?.name === "Teacher" &&
                  t.school?._id === formData.schoolId
              )
              .map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Class"}
        </button>
      </div>
    </form>
  );
};

export default ClassForm;

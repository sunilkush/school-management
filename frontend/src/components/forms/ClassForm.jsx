import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllUser } from '../../features/auth/authSlice';
import { fetchAllSubjects } from '../../features/subject/subjectSlice';

const ClassForm = ({ teacherList = [], onSubmit }) => {
  const dispatch = useDispatch();
  const { users = [] } = useSelector((state) => state.auth);
  const { subjectList = [] } = useSelector((state) => state.subject || {});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    teacherId: '',
    subjects: [],
    schoolId: JSON.parse(localStorage.getItem('user'))?.school?._id || '',
  });
  console.log(formData);
  const classList = [
    '1st', '2nd', '3rd', '4th', '5th', '6th',
    '7th', '8th', '9th', '10th', '11th', '12th',
  ];

  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, subjects: selected }));
  };

  const handleSubmit = (e) => {
    debugger;
  e.preventDefault();

  if (!formData.name || !formData.section || !formData.teacherId || formData.subjects.length === 0) {
    setError("Please fill in all required fields.");
    setMessage("");
    return;
  }

  if (onSubmit) {
    try {
      onSubmit(formData); // assumes parent handles actual dispatch
      setMessage("Class created successfully!");
      setError("");
      // Reset form
      setFormData({
        name: '',
        section: '',
        teacherId: '',
        subjects: [],
        schoolId: users?.school?._id
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Something went wrong while creating class.");
      setMessage("");
    }
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
            className="border px-2 py-2 w-full rounded-lg"
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
            className="border px-2 py-2 w-full rounded-lg"
            required
          >
            <option value="">Select Section</option>
            {['A', 'B', 'C', 'D'].map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {/* Subjects */}
        <div className="">
          <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-1">
            Select Subjects
          </label>
          <select
            id="subjects"
            name="subjects"
            multiple
            value={formData.subjects}
            onChange={handleSubjectChange}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            required
          >
            {Array.isArray(subjectList) && subjectList.length > 0 ? (
              subjectList.map((subject) => (
                <option key={subject._id} value={subject._id} className="text-gray-700">
                  {subject.name}
                </option>
              ))
            ) : (
              <option disabled className="text-gray-400">No subjects found</option>
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</p>
        </div>

        {/* Teacher */}
        <div>
          <label className="block mb-1">Select Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="border px-2 py-2 w-full rounded-lg"
            required
          >
            <option value="">Select Teacher</option>
            {teachersToShow.length === 0 ? (
              <option disabled>No teachers available</option>
            ) : (
              teachersToShow
                .filter(
                  (t) =>
                    t.role?.name === "Teacher" &&
                    t.school?._id === formData.schoolId
                )
                .map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))
            )}
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Class
        </button>
      </div>
    </form>
  );
};

export default ClassForm;

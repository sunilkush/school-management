import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllUser } from '../../features/auth/authSlice';
import { fetchAllSubjects } from '../../features/subject/subjectSlice';

const ClassForm = ({ teacherList = [], onSubmit }) => {
  const dispatch = useDispatch();
  const { users = [] } = useSelector((state) => state.auth);
 const { subjectList = [] } = useSelector((state) => state.subject || {});
 
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, subjects: selected }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.section || !formData.teacherId || formData.subjects.length === 0) {
      alert('Please fill in all required fields.');
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const teachersToShow = teacherList.length ? teacherList : users;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold">Add Class</h2>

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
        <div>
          <label className="block mb-1">Select Subjects</label>
          <select
            multiple
            value={formData.subjects}
            onChange={handleSubjectChange}
            className="border px-2 py-2 w-full rounded-lg h-32"
            required
          >
            {Array.isArray(subjectList) ? (
              subjectList.map((subject) => (
                <div key={subject._id}>{subject.name}</div>
              ))
            ) : (
              <p>No subjects found</p>
            )}
          </select>
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

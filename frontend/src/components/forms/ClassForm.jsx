import React, { useState } from 'react';

const ClassForm = ({ subjectList = [], teacherList = [], onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    teacherId: '',
    subjects: [],
  });

  const classList = [
    '1st', '2nd', '3rd', '4th', '5th', '6th',
    '7th', '8th', '9th', '10th', '11th', '12th',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData((prev) => ({ ...prev, subjects: selected }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='w-full min-w-full space-y-6 bg-white rounded-lg shadow-lg p-6'>
      <h2 className='text-2xl font-bold'>Add Class</h2>

      <div className='grid grid-cols-4 gap-4'>

        {/* Class Name */}
        <div>
          <label className="block mb-1">Class Name</label>
          <select
            name="name"
            value={formData.name}
            onChange={handleChange}
            className='border px-2 py-2 w-full rounded-lg'
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
            className='border px-2 py-2 w-full rounded-lg'
            required
          >
            <option value="">Select Section</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </select>
        </div>

        {/* Subjects */}
        <div>
          <label className="block mb-1">Select Subjects</label>
          <select
            multiple
            className='border px-2 py-2 w-full rounded-lg h-32'
            value={formData.subjects}
            onChange={handleSubjectChange}
          >
            {subjectList.length === 0 ? (
              <option disabled>No subjects available. Please create subjects first.</option>
            ) : (
              subjectList.map((subj) => (
                <option key={subj._id} value={subj._id}>
                  {subj.name}
                </option>
              ))
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
            className='border px-2 py-2 w-full rounded-lg'
          >
            <option value="">Select Teacher</option>
            {teacherList.map((teacher) => (
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
        >
          Create Class
        </button>
      </div>
    </form>
  );
};

export default ClassForm;

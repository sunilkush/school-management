import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAcademicYear } from "../features/academicYear/academicYearSlice.js";
import { fetchSchools } from "../features/schools/schoolSlice.js"; // Import your school fetching action

const CreateAcademicYear = () => {
  const dispatch = useDispatch();

  const { loading, error, successMessage } = useSelector((state) => state.academicYear);
  const { schools = [] } = useSelector((state) => state.school || {}); // assuming schoolSlice is connected

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    isActive: false,
    schoolId: "", // <-- new field
  });

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.schoolId) return alert("Please select a school");
    dispatch(createAcademicYear(formData));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">Create Academic Year</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block font-medium">Select School</label>
          <select
            name="schoolId"
            value={formData.schoolId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">-- Select School --</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Academic Year Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="2025-26"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Code</label>
            <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="AY2025"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm">Set as Active Academic Year</label>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
      </form>
    </div>
  );
};

export default CreateAcademicYear;

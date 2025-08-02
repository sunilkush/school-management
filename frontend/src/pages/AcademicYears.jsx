import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createAcademicYear } from "../features/academicYear/acadmicYearSclice";

const AcademicYearForm = ({ schoolId }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createAcademicYear({ ...form, school: schoolId }));
    setForm({ name: "", code: "", startDate: "", endDate: "", description: "", isActive: false });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-2 bg-white rounded shadow">
      <input
        type="text"
        placeholder="Name"
        className="border p-2 w-full"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Code"
        className="border p-2 w-full"
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value })}
        required
      />
      <input
        type="date"
        className="border p-2 w-full"
        value={form.startDate}
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        required
      />
      <input
        type="date"
        className="border p-2 w-full"
        value={form.endDate}
        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        required
      />
      <textarea
        placeholder="Description"
        className="border p-2 w-full"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="mr-2"
        />
        Set Active
      </label>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Create
      </button>
    </form>
  );
};

export default AcademicYearForm;

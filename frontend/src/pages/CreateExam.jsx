import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createExam } from "../features/exams/examSlice";

const CreateExam = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    title: "",
    duration: 60,
    totalMarks: 100,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createExam(form));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📝 Create New Exam</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Exam Title"
          className="w-full p-2 border rounded"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          className="w-full p-2 border rounded"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
        <input
          type="number"
          placeholder="Total Marks"
          className="w-full p-2 border rounded"
          value={form.totalMarks}
          onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          Create Exam
        </button>
      </form>
    </div>
  );
};

export default CreateExam;

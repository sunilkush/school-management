import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSubject } from "../../features/subject/subjectSlice";
import { fetchAllClasses } from "../../features/classes/classSlice";
import { fetchAllUser } from "../../features/auth/authSlice"; // ✅ Correct import
import { Button } from "@/components/ui/button";

const SubjectForm = () => {
  const dispatch = useDispatch();

  const { classes } = useSelector((state) => state.class);
  const { users } = useSelector((state) => state.auth); // ✅ use users from authSlice
  const { loading, successMessage, error } = useSelector((state) => state.subject);

  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    teacherId: "",
  });

  useEffect(() => {
    dispatch(fetchAllClasses());
    dispatch(fetchAllUser()); // ✅ must be called
  }, [dispatch]);

  // ✅ Filter only teachers from users
  const teachers = users?.filter((u) => u.role === "teacher");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createSubject(formData));
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Create Subject</h2>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Subject Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter subject name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Select Class */}
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Class</option>
            {classes?.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name} - {cls.section}
              </option>
            ))}
          </select>
        </div>

        {/* Select Teacher */}
        <div>
          <label className="block text-sm font-medium mb-1">Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Teacher</option>
            {teachers?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Subject"}
        </Button>
      </form>
    </div>
  );
};

export default SubjectForm;

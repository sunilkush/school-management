import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../features/auth/authSlice";
import { createSubject } from "../../features/subject/subjectSlice";


const SubjectForm = () => {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const { success, error } = useSelector((state) => state.subject);


  // 🔁 Fetch all users on mount
  useEffect(() => {
    dispatch(fetchAllUser());
   
  }, [dispatch]);

  // ✅ Get users from Redux
  const { users } = useSelector((state) => state.auth);
  const teachers = Array.isArray(users)
    ? users.filter((user) => user?.role?.name === "Teacher" && user?.school?._id === JSON.parse(localStorage.getItem("user"))?.school?._id)
    : [];

  // ✅ Get school ID from logged-in user in localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const schoolId = storedUser?.school?._id;

  const [formData, setFormData] = useState({
    name: "",
    teacherId: "",
    schoolId: schoolId || "", // initial value set
   
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value.toLowerCase() : value,
    }));
  };
useEffect(() => {
  if (success || error) {
    const timer = setTimeout(() => {
      setMessage("");
      // Optional: Reset the Redux success/error here if you have an action like `resetSubjectState`
      // dispatch(resetSubjectState());
    }, 3000);
    return () => clearTimeout(timer); // Cleanup
  }
}, [success, error]);
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.schoolId) {
      alert("School ID is missing");
      return;
    }

    if (formData.name && formData.teacherId) {
      dispatch(createSubject(formData));
      setMessage(success || "Subject created successfully!");

      setFormData({
        name: "",
        teacherId: "",
        schoolId,
        academicYearId: "",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4"
    >
      <h2 className="text-xl font-semibold">Create Subject</h2>

      {success && (
        <div className="bg-green-100 text-green-800 border border-green-300 rounded p-3">
          {message || "Subject created successfully!"}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-300 rounded p-3">
          {error}
        </div>
      )}
     
      {/* Subject Name */}
      <div>
        <label className="block mb-1 font-medium">Subject Name</label>
        <input
          type="text"
          name="name"
          value={formData.name.toLowerCase()}
          onChange={handleChange}
          placeholder="e.g. Science"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Assign Teacher */}
      <div>
        <label className="block mb-1 font-medium">Assign Teacher</label>
        <select
          name="teacherId"
          value={formData.teacherId}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select Teacher</option>
          {teachers.length > 0 ? (
            teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))
          ) : (
            <option disabled>No teachers available</option>
          )}
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Subject
      </button>
    </form>
  );
};

export default SubjectForm;

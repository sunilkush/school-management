import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/roleSlice.js";
import { fetchSchools } from "../store/schoolSlice.js";
import { registerUser } from "../store/registerSlice.js";
import { toast } from "react-toastify";

const SignUpPage = () => {
  const dispatch = useDispatch();
  const { roles } = useSelector((state) => state.roles || {});
  const { schools } = useSelector((state) => state.schools || {});
  const { status, error } = useSelector((state) => state.register || {});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
    isActive: true,
    roleId: "",
    schoolId: "",
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    if (status === "succeeded") {
      toast.success("User registered successfully!");
    }
    if (status === "failed") {
      toast.error(error || "Registration failed.");
    }
  }, [status, error]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("isActive", formData.isActive);
    data.append("roleId", formData.roleId);
    data.append("schoolId", formData.schoolId);
    if (formData.avatar) {
      data.append("avatar", formData.avatar);
    }

    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-gray-50 py-10 px-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-4xl p-8 md:grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Register Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="roleId"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Select Role</option>
                {roles
                  .filter((role) => role.name !== "Super Admin")
                  .map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                ))}
                
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <select
                name="schoolId"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Select School</option>
                {schools?.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Avatar</label>
              <input
                type="file"
                name="avatar"
                onChange={handleChange}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {status === "loading" ? "Registering..." : "Register"}
            </button>
          </form>
        </div>

        {/* Optional: Visual/Preview Section */}
        <div className="hidden md:flex items-center justify-center bg-cyan-50 rounded-lg">
          <p className="text-lg text-gray-600 px-4 text-center">
            Securely register administrators with role-based permissions and school associations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

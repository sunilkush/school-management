import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/roleSlice.js";
import { fetchSchools } from "../store/schoolSlice.js";
import { registerUser } from "../store/registerSlice.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
const CreateUser = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const { roles } = useSelector((state) => state.roles || {});
  const { schools } = useSelector((state) => state.schools || {});
  const { status, error } = useSelector((state) => state.register || {});
  console.log(schools)
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
      setFormData({
        name: "",
        email: "",
        password: "",
        avatar: "",
        isActive: true,
        roleId: "",
        schoolId: "",
      });
    }
    if (status === "failed") {
      toast.error(error || "Registration failed.");
    }
  }, [status, error]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "avatar") {
      setFormData({ ...formData, avatar: files[0] }); // set file object
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
    <>

      <div className="min-h-screen flex items-center justify-center bg-blue-gray-50 py-10 px-4">
        <div className="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 md:px-24 md:py-14 py-8 border border-gray-300 w-full max-w-3xl">
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
                  value={formData.name}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="roleId"
                onChange={handleChange}
                value={formData.role}
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
                  value={formData.school}
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
               
              <div className="text-sm text-gray-600 mt-1">
                Can't find the school?{" "}
                <Link to="/dashboard/school-register" className="text-cyan-600 hover:underline">
                  Register a new school
                </Link>
              </div>
              </div>
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
                className="hidden sm:inline-flex  text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Registering..." : "Register"}
              </button>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUser;

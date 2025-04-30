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
      <div className="pt-6 px-4">
        <div className="bg-white md:flex md:items-center md:justify-between shadow rounded-lg p-4 md:p-6 xl:p-8 my-6 mx-4">
          <form onSubmit={handleSubmit}>
            <input name="name" type="text" placeholder="Name" onChange={handleChange} className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5" />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} className="bg-gray-50 mb-2 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5" />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} className="bg-gray-50 mb-2 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5" />

            <select name="roleId" onChange={handleChange} className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5">
              <option value="">Select Role</option>
              
              {roles?.length > 0 &&
                roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
            </select>

            <select name="schoolId" onChange={handleChange} className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5">
              <option value="">Select School</option>
              {schools?.length > 0 &&
                schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
            </select>
            <input type="file" name="avatar" onChange={handleChange} className="bg-gray-50 border mb-2 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full  p-2.5"/>
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
    </>
  );
};

export default SignUpPage;

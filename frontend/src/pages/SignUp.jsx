import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/roleSlice.js";
import { fetchSchools } from "../store/schoolSlice.js";
import { registerUser } from "../store/registerSlice.js";

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
    role: "",   // ✅ Corrected
    school: "", // ✅ Corrected
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData); // ✅ Optional for debugging
    dispatch(registerUser(formData));
  };

  return (
    <>
      <div className="pt-6 px-4">
        <div className="bg-white md:flex md:items-center md:justify-between shadow rounded-lg p-4 md:p-6 xl:p-8 my-6 mx-4">
          <form onSubmit={handleSubmit}>
            <input name="name" type="text" placeholder="Name" onChange={handleChange} />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />

            <select name="role" onChange={handleChange}>
              <option value="">Select Role</option>
              {roles?.length > 0 &&
                roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
            </select>

            <select name="school" onChange={handleChange}>
              <option value="">Select School</option>
              {schools?.length > 0 &&
                schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
            </select>

            <button
              type="submit"
              className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Registering..." : "Register"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;

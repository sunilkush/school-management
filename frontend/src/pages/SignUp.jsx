import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/roleSlice.js";
import { fetchSchools } from "../store/schoolSlice.js";
import { registerUser } from "../store/registerSlice.js";

const SignUpPage = () => {
  const dispatch = useDispatch();
  const { roles } = useSelector((state) => state.roles);
  const { schools } = useSelector((state) => state.schools);
  const { status, error } = useSelector((state) => state.register);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
    isActive: true,
    role: "",
    school: "",
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
    dispatch(registerUser(formData));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" placeholder="Name" onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      
      <select name="role" onChange={handleChange}>
        <option value="">Select Role</option>
        {roles.map((role) => (
          <option key={role._id} value={role._id}>{role.name}</option>
        ))}
      </select>

      <select name="school" onChange={handleChange}>
        <option value="">Select School</option>
        {schools.map((school) => (
          <option key={school._id} value={school._id}>{school.name}</option>
        ))}
      </select>

      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Registering..." : "Register"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default SignUpPage;

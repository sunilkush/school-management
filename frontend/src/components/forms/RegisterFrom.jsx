import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../features/schools/schoolSlice";
import { fetchRoles } from "../../features/roles/roleSlice";
import { registerUser } from "../../features/auth/authSlice";

const RegisterFrom = () => {
    
    const {roles} = useSelector((state)=>state.role)
    const {schools} = useSelector((state)=>state.school)
    const {isLoading ,error} = useSelector((state)=>state.auth)
    
   
    const dispatch = useDispatch()
    const [formData,setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
        school: "",
        isActive: false,
        /* acceptTerms: false, */
    });
    useEffect(()=>{
         dispatch(fetchSchools())
         dispatch(fetchRoles())
    },[dispatch])
    // handal change 
    const handleChange = (e) => {
        const {name,value,type,checked} = e.target
    setFormData({ ...formData, [name]:type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) =>{
     e.preventDefault();
     dispatch(registerUser(formData))
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 text-center">Register</h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Create your account. It’s free and only takes a minute
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* <!-- Name --> */}
        <input
          name="name"
          onChange={handleChange}
          value={formData.name}
          type="text"
          placeholder="Name"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/*  <!-- Email --> */}
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/*  <!-- Password --> */}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {/* <!-- Role Dropdown --> */}
        <select 
       name="role"
          value={formData.role}
          onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400">
          <option value="" disabled>
            Select Role
          </option>
          {roles?.map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        </select>

        {/*  <!-- School Dropdown --> */}
        <select name="school"
          value={formData.school}
          onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400">
          <option value="" disabled>
            Select School
          </option>
          {schools?.map((school) => (
            <option key={school._id} value={school._id}>
              {school.name}
            </option>
          ))}
        </select>

        {/*  <!-- Is Active Checkbox --> */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-600">
            Is Active
          </label>
        </div>

        {/* <!-- Terms --> */}
       {/*  <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label for="terms" className="text-sm text-gray-600">
            I accept the
            <a href="#" className="text-purple-600 underline">
              Terms of Use
            </a>{" "}
            &
            <a href="#" className="text-purple-600 underline">
              Privacy Policy
            </a>
          </label>
        </div> */}

        {/*  <!-- Submit --> */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 transition duration-200"
        >
          {isLoading ? "Registering..." : "Register Now"}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
};

export default RegisterFrom;

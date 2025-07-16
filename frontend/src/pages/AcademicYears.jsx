
import React from 'react'
import { useState } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { fetchSchools } from '../features/schools/schoolSlice';
import { fetchAllUser } from '../features/auth/authSlice';
import { useEffect } from 'react';
const AcademicYears = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state) => state.auth);
  const {schools} = useSelector((state) => state.school);
  console.log(user,schools)
  useEffect(()=>{
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  },[dispatch])


  const [formData, setFromData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    schoolId: "",
    isAction: false
  })

  const handleChange = (e) => {
    const { name, value,type,checked } = e.target;
     setFromData((prev)=>({
      ...prev,
      [name]: type === "checkbox" ? checked : value
     }))
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
  }
  return (
    <div>
      <div className='w-full'>
        <div className='w-full md:w-1/4 bg-white p-4 space-y-4 border rounded-md shadow-md'>
          <h1 className='text-2xl font-bold'>Academic Years</h1>
          <p className='text-gray-600'>Manage academic years for your institution.</p>
          <form className='space-y-4' onAbort={handleSubmit}>
            <div>
              <label>Academic Year Name</label>
              <input type="text"
                className='w-full border p-2 rounded'
                value={formData.name}
                onChange={handleChange}
                required
                placeholder='Enter Academic Year Name' />
            </div>
            <div className=''>
              <label>Start Date</label>
              <input type="date"
                placeholder='Enter Start Date'
                value={formData.startDate}
                onChange={handleChange}
                required
                className='w-full border p-2 rounded' />
            </div>
            <div className=''>
              <label>End Date</label>
              <input type="date"
                placeholder='Enter End Date'
                value={formData.endDate}
                onChange={handleChange}
                required
                className='w-full border p-2 rounded' />
            </div>
            <div>
              <label>School</label>
              <select
                name='schoolId'
                required
                value={formData.schoolId}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${user?.role?.name === "School Admin" ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Select School</option>
                {schools?.map((school) => (
                  <option key={school._id} value={school._id}> {school.name}</option>) )}
              </select>
            </div>
            <div>
              <label className='flex items-center' htmlFor="isActive">
                <input type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className='mr-2' />  <span>Is Active</span>
              </label>
            </div>
            <div>
              <button type='submit' className='bg-blue-500 text-white p-2 rounded'>Add Academic Year</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AcademicYears

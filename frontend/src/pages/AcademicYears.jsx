import { useState } from 'react';
import { useSelector,useDispatch } from 'react-redux';
import { fetchSchools } from '../features/schools/schoolSlice';
import { fetchAllUser } from '../features/auth/authSlice';
import { createAcadmicYear } from '../features/academicYear/acadmicYearSclice';
import { useEffect } from 'react';
const AcademicYears = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state) => state.auth);
  const {schools} = useSelector((state) => state.school);
  const {loading, error, message} = useSelector((state) => state.acadmicYear);
  
  useEffect(()=>{
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  },[dispatch])

 useEffect(() => {
  if (user?.role?.name === "School Admin") {
    setFromData((prev) => ({ ...prev, schoolId: user?.school?._Id }));
  }
}, [user]);
  const [formData, setFromData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    schoolId: "",
    isActive: false
  })

  const handleChange = (e) => {
    const { name, value,type,checked } = e.target;
     setFromData((prev)=>({
      ...prev,
      [name]: type === "checkbox" ? checked : value
     }))
  }
  const handleSubmit = async(e) => {
    e.preventDefault();
    // Handle form submission logic here
    try {
    await dispatch(createAcadmicYear(formData)).unwrap();
    alert("Academic year created successfully!");
    setFromData({
      name: "",
      startDate: "",
      endDate: "",
      schoolId: user?.role?.name === "School Admin" ? user.schoolId : "",
      isActive: false
    });
  } catch (error) {
    alert("Failed to create academic year: " + error);
  }
  }
  return (
    <div>{loading && <p>Loading...</p>}
      <div className='w-full'>
        <div className='w-full md:w-1/4 bg-white p-4 space-y-4 border rounded-md shadow-md'>
          <h1 className='text-2xl font-bold'>Academic Years</h1>
          <p className='text-gray-600'>Manage academic years for your institution.</p>
          {error && <p className='text-red-500'>{error}</p>}
          {message && <p className='text-green-500'>{message}</p>}
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label>Academic Year Name</label>
              <input type="text"
              name ='name'
                className='w-full border p-2 rounded'
                value={formData.name}
                onChange={handleChange}
                required
                placeholder='Enter Academic Year Name' />
            </div>
            <div className=''>
              <label>Start Date</label>
              <input type="date"
                name='startDate'
                placeholder='Enter Start Date'
                value={formData.startDate}
                onChange={handleChange}
                required
                className='w-full border p-2 rounded' />
            </div>
            <div className=''>
              <label>End Date</label>
              <input type="date"
                name='endDate'
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
                placeholder='Select School'
              
                required
                value={formData.schoolId}
                onChange={handleChange}
                className={`w-full border p-2 rounded ${user?.role?.name === "School Admin" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                disabled={user?.role?.name === "School Admin"}
              >
                <option value="">Select School</option>
                {schools?.map((school) => (
                  <option key={school._id} value={school._id}> {school.name}</option>) )}
              </select>
            </div>
            <div>
              <label className='flex items-center' htmlFor="isActive">
                <input type="checkbox"
                  name="isActive"
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

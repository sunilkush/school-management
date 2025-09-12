import { EllipsisVertical, MailPlus, User, CalendarCheck, ClipboardList, MessageCircleMore, Settings, FolderClosed, ChevronRight, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import userProfile from '../../assets/userProfile.png';
import AttendanceCalendar from '../../pages/AttendanceCalendar';
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from '../../features/auth/authSlice';
import { Select, DatePicker, Input,Button } from "antd";
const { Option } = Select;

const EmployeeForm = () => {

  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.auth); // ✅ add loading if reducer supports it
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("id"); // ✅ capture ?id from URL
  const [activeTab, setActiveTab] = useState("Profile");
  const [date, setDate] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    // Multi-school support
    schoolId: "",
    academicYearId: "",
    // Basic Info
    phoneNo: "",
    maritalStatus:"",
    gender: "",
    dateOfBirth: "",
    bloodType: "",
    religion: "",
    // Address
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    // ID Proof
    idProof: "",
    citizenAddress: "",
    // Employment
    department: "", // or ObjectId ref if you want separate Department collection
    designation: "", // or ObjectId ref
    employeeStatus: "",
    joinDate: "",
    // Salary
    salaryId: "",
    // Teacher-specific fields
    qualification: [],
    experience: "",
    subjects: [],
    // Banking Details (Salary Credit ke liye)
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
    panNumber: "",
    pfNumber: "",
    esiNumber: "",
    // Common
    notes: "",
    isActive: "",
  });

  const subjects = [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Science" },
    { id: 3, name: "English" },
    { id: 4, name: "History" },
    { id: 5, name: "Computer" },
  ];

  const qualifications = [
    { id: 1, name: "High School / 10th" },
    { id: 2, name: "Intermediate / 12th" },
    { id: 3, name: "Diploma" },
    { id: 4, name: "Bachelor's Degree (B.A., B.Sc., B.Com, B.Tech, BBA, BCA)" },
    { id: 5, name: "Master's Degree (M.A., M.Sc., M.Com, M.Tech, MBA, MCA)" },
    { id: 6, name: "PhD / Doctorate" },
    { id: 7, name: "ITI / Trade Course" },
    { id: 8, name: "Professional Certification (CA, CS, CMA, PMP, etc.)" },
    { id: 9, name: "Other" }
  ];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-","RH"];
  const martialStatuses = ["Single", "Married", "Divorced", "Widowed", "Separated", "Registered Partnership"];
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleSubmit = () => {
    console.log("Collected Employee Data:", formData);
    // yaha API call ya Redux dispatch kar sakte ho
  };
  useEffect(() => {
    if (employeeId) {
      dispatch(getUserById(employeeId));
    }
  }, [dispatch, employeeId]);
  return (
    <>
      <div className=" bg-gray-50 min-h-screen ">
        {/* Profile Details Section */}
        <div className='flex justify-between flex-col md:flex-row lg:flex-row  sm:p-1 md:p-5 lg:p-5'>
          <div className="flex items-center  sm:space-x-0 md:space-x-4 lg:space-x-4  mb-6 flex-col md:flex-row lg:flex-row">
            <div className='flex items-center space-x-4  flex-col md:flex-row lg:flex-row mb-4 md:mb-0 lg:mb-0'>
              <div>
                <img
                  src={profile?.avatar || userProfile}
                  alt="User Profile"
                  className="w-16 h-16 rounded-full object-cover" />
              </div>

              <div>
                <h3 className='text-lg  font-medium capitalize'>{profile?.name || "N/A"}</h3>
                <p className='text-xs text-center bg-green-100 text-green-900 rounded-full  px-3 py-1 inline-block'>{profile?.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
            <div className='ml-auto flex items-center space-x-5 border-l px-3'>
              <div>
                <p className='text-xs text-gray-800'>Last Clocked In</p>
                <p className='text-sm text-gray-800'>A few seconds ago</p>
              </div>
              <div>
                <p className='text-xs text-gray-800'>Last Messaged</p>
                <p className='text-sm text-gray-800'>2 days ago</p>
              </div>
              <div>
                <p className='text-xs text-gray-800'>Employee ID</p>
                <p className='text-sm text-gray-800'>{profile?.regId || "NA"}</p>

              </div>
            </div>
          </div>
          <div className='flex items-center space-x-4 mb-6  sm:justify-center md:justify-end lg:justify-end'>
            <div>
              <button className='px-1 py-1 border bg-white rounded-md'><EllipsisVertical /></button>
            </div>
            <div className='flex items-center'>
              <button className='px-3 py-1 text-sm flex items-center gap-2 bg-deep-purple-800 rounded-md text-white'> <MailPlus className='w-5' /> Send Email</button>
            </div>
          </div>
        </div>
        {/* Profile tab Section */}
        <div className='flex border-b border-gray flex-wrap md:flex-row lg:flex-row'>
          <div>
            <button onClick={() => setActiveTab('Profile')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Profile' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><User className='w-4 mr-1' /> Profile</button>
          </div>
          <div>
            <button onClick={() => setActiveTab('Attendance')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
             ${activeTab === 'Attendance' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><CalendarCheck className='w-4 mr-1' /> Attendance</button>
          </div>
          <div>
            <button onClick={() => setActiveTab('Tasks')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Tasks' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><ClipboardList className='w-4 mr-1' /> Tasks</button>
          </div>
          <div>
            <button onClick={() => setActiveTab('Messages')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
             ${activeTab === 'Messages' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><MessageCircleMore className='w-4 mr-1' /> Messages</button>
          </div>
          <div>
            <button onClick={() => setActiveTab('Files')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Files' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><FolderClosed className='w-4 mr-1' /> Files</button>
          </div>
          <div>
            <button onClick={() => setActiveTab('Settings')}
              type='button'
              className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Settings' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-800 hover:text-purple-600'}`}
            ><Settings className='w-4 mr-1' />Settings</button>
          </div>

        </div>
        {activeTab === 'Profile' && (

          <div  >
            <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-3 mt-3'>

              <div className='col-span-2 '>
                <div className='flex flex-col gap-3'>
                  {/*Contact Information start*/}
                  <div className='bg-white p-4 rounded-lg border'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-lg font-medium'>Personal Information</h3>
                      <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4' /> Edit</a>
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-5 mt-3'>

                      <div>
                        <p className='text-xs text-gray-800'>Gender</p>
                        <Select mode="single"
                          value={formData.gender || undefined}
                          onChange={(val) => handleChange("gender", val)}
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select subjects">
                          <Option value >Select</Option>
                          <Option value={'Male'}>Male</Option>
                          <Option value={'Female'}>Female</Option>
                        </Select>
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Marital Status</p>
                       <Select
                       
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Select Marital Status"
                        value={formData.maritalStatus || undefined}
                        onChange={(val) => handleChange("maritalStatus", val)}
                      >
                        {martialStatuses.map((status) => (
                          <Option key={status} value={status}>
                            {status}
                          </Option>
                        ))}
                      </Select>
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Religion</p>

                        <Select mode="single"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select subjects"
                          value={formData.religion || undefined}
                          onChange={(val) => handleChange("religion", val)}
                        >
                          <Option value >Select</Option>
                          <Option value={'Hindu'}>Hindu</Option>
                          <Option value={'Muslim'}>Muslim</Option>
                          <Option value={'Christian'}>Christian</Option>
                          <Option value={'Sikh'}>Sikh</Option>
                          <Option value={'Buddhist'}>Buddhist</Option>
                          <Option value={'Jain'}>Jain</Option>
                          <Option value={'Other'}>Other</Option>
                        </Select>
                      </div>

                      <div>
                        <p className='text-xs text-gray-800'>Birth Date</p>
                        <DatePicker
                          className="w-full"
                          value={date}
                          onChange={(date, dateString) => setDate(dateString)}
                          format="YYYY-MM-DD"
                          placeholder="Select date"
                        />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Blood Type</p>
                        <Select mode="single"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select Blood Type">

                          {bloodGroups.map((bg) => (
                            <Option key={bg} value={bg}>
                              {bg}
                            </Option> ))}
                        </Select>
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Id Proof</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Addhar Number' />
                      </div>
                      <div>
                        <p className="text-xs text-gray-800">Qualification</p>
                         <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select Qualification"
                          value={formData.qualification}
                            onChange={(vals) => handleChange("qualification", vals)}
                        >
                          {qualifications.map((q) => (
                              <Option key={q.id} value={q.name}>
                                {q.name}
                              </Option>
                            ))}
                        </Select>
                          
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Experience</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Addhar Number' />
                      </div>
                      <div>
                        <p className="text-xs text-gray-800">Subjects</p>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ width: "100%" }}
                          placeholder="Select subjects"
                          value={formData.subjects}
                          onChange={(vals) => handleChange("subjects", vals)}
                        >
                          {subjects.map((subject) => (
                            <Option key={subject.id} value={subject.name}>
                              {subject.name}
                            </Option>
                          ))}
                        </Select>
                      </div>

                    </div>

                  </div>
                  {/*Contact Information end*/}
                  <div className='bg-white p-4 rounded-lg border'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-lg font-medium'>Bank Information</h3>
                      <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4' /> Edit</a>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                      <div>
                        <p className='text-xs text-gray-800'>Account Holder</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full'  placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Account Number</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>IFSC Code</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Bank Name</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Branch</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>Pan Number</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>PF Number</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>ESI Number</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Bank Name' />
                      </div>



                    </div>
                  </div>
                  {/* Address Information start */}
                  <div className='bg-white p-4 rounded-lg border'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='text-lg font-medium'>Address Information</h3>
                      <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4' /> Edit</a>
                    </div>
                    <div className='grid grid-cols-2 gap-5'>
                      <div><p className='text-sm'>Parsent Address</p></div>
                      <div> <div className='flex items-center justify-end'>
                        <p className='text-xs text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>

                      </div></div>
                    </div>
                    <div className='grid grid-cols-4 gap-5 mt-3'>
                      <div>

                        <p className='text-xs text-gray-800'>street</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full ' placeholder='' />

                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>City</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full ' placeholder='' />

                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>State</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='' />

                      </div>
                      <div>
                        <p className='text-xs text-gray-800'>zipCode</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='' />

                      </div>


                      <hr className='col-span-4' />
                      <div className='col-span-3'>
                        <p className='text-xs text-gray-800'>Citizen ID Address</p>
                        <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='' />
                      </div>
                      <div className='col-span-1 flex items-center justify-end'>

                        <p className='text-xs text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>


                      </div>


                    </div>
                  </div>
                  {/* Address Information end */}
                </div>
              </div>
              <div className='col-span-1 gap-3 flex flex-col mt-3 md:mt-0'>
                {/*Contact Information start */}
                <div className='bg-white p-4 rounded-lg border w-full'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-lg font-medium'>Contact Information</h3>
                    <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4' /> Edit</a>
                  </div>
                  <h4 className='text-sm font-medium my-2'>Personal Contact </h4>
                  <div className=' grid grid-cols-2   gap-5 mt-3'>
                    <div className='col-span-1 '>
                      <p className='text-xs text-gray-800'>Phone</p>
                      <Input type='email' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' />
                    </div>
                    <div className='col-span-1 '>
                      <p className='text-xs text-gray-800'>Email</p>
                      <Input type='email' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' />
                    </div>


                  </div>
                </div>
                {/*Contact Information end */}
                {/* Student Overview start */}
                <div className='bg-white p-4 rounded-lg border w-full'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-lg font-medium'>Student Overview</h3>
                    <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4' /> Edit</a>
                  </div>

                  <div className='grid grid-cols-2 gap-5 mt-3'>
                    <div>
                      <p className='text-xs text-gray-800'>Joining Date</p>
                      <DatePicker
                        className="w-full"
                        value={date}
                        onChange={(date, dateString) => setDate(dateString)}
                        format="YYYY-MM-DD"
                        placeholder="Select date"
                      />
                    </div>
                    <div>
                      <p className='text-xs text-gray-800'>Department</p>
                      <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Department' />
                    </div>
                    <hr className='col-span-2' />
                    <div>
                      <p className='text-xs text-gray-800'>Designation</p>
                      <Input type='text' className='text-sm text-gray-800 border rounded-md px-3 py-1 w-full' placeholder='Designation' />
                    </div>
                    <div>
                      <p className='text-xs text-gray-800'>Employee Status</p>
                      <Select mode="single"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Select Blood Type">

                        <Option value >Select</Option>
                        <Option value={'Full-Time'}>Full-Time</Option>
                        <Option value={'Part-Time'}>Part-Time</Option>
                        <Option value={'Contract'}>Contract</Option>

                      </Select>
                    </div>
                   
                  </div>
                </div>
                {/* Student Overview end */}
                 <Button type="primary" className="mt-5" onClick={handleSubmit}>
        Save Employee
      </Button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Attendance' && (
          <div id='Attendence-details'>
            <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-3 mt-3'>

              <div className='col-span-3  gap-3 flex flex-col'>
                {/*Contact Information start*/}
                <div className='bg-white p-4 rounded-lg border'>

                  <div className='grid grid-cols-1 gap-5'>
                    <AttendanceCalendar />
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
        {activeTab === 'Tasks' && (
          <div className="bg-white p-4 rounded-lg border mt-3">
            <p className="text-gray-800 text-sm">Tasks Options coming soon...</p>
          </div>
        )}
        {activeTab === 'Messages' && (
          <div className="bg-white p-4 rounded-lg border mt-3">
            <p className="text-gray-800 text-sm">Messages Options coming soon...</p>
          </div>
        )}
        {activeTab === 'Files' && (
          <div className="bg-white p-4 rounded-lg border mt-3">
            <p className="text-gray-800 text-sm">Files Options coming soon...</p>
          </div>
        )}
        {activeTab === 'Settings' && (
          <div className="bg-white p-4 rounded-lg border mt-3">
            <p className="text-gray-800 text-sm">Settings Options coming soon...</p>
          </div>
        )}

      </div>


    </>
  )
};

export default EmployeeForm;

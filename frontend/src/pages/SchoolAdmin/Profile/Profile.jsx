
import { EllipsisVertical,MailPlus,User,CalendarCheck,ClipboardList,MessageCircleMore,Settings,FolderClosed, ChevronRight, PencilLine } from 'lucide-react';
import { useState } from 'react';
import userProfile from '../assets/userProfile.png';
import AttendanceCalendar from './AttendanceCalendar';
const Profile = () => { 

  const [activeTab, setActiveTab] = useState('Profile');
  return (
    <>
     
      <div className=" bg-gray-50 min-h-screen ">
        {/* Profile Details Section */}
        <div className='flex justify-between flex-col md:flex-row lg:flex-row  sm:p-1 md:p-5 lg:p-5'>
          <div className="flex items-center  sm:space-x-0 md:space-x-4 lg:space-x-4  mb-6 flex-col md:flex-row lg:flex-row">
            <div className='flex items-center space-x-4  flex-col md:flex-row lg:flex-row mb-4 md:mb-0 lg:mb-0'>
              <div>
                <img
                  src={userProfile}
                  alt="User Profile"
                  className="w-16 h-16 rounded-full object-cover" />
              </div>

              <div>
                <h3 className='text-lg  font-medium'>Sumit Kumar</h3>
                <p className='text-xs text-white text-center bg-green-600 rounded-full  px-2 inline-block'>Active</p>
              </div>
            </div>
            <div className='ml-auto flex items-center space-x-5 border-l px-3'>
              <div>
                <p className='text-xs text-gray-500'>Last Clocked In</p>
                <p className='text-sm text-gray-800'>A few seconds ago</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Last Messaged</p>
                <p className='text-sm text-gray-800'>2 days ago</p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Employee ID</p>
                <p className='text-sm text-gray-800'>#123456</p>

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
            <button onClick={()=>setActiveTab('Profile')}  
             type='button'
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Profile' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
            ><User className='w-4 mr-1'/> Profile</button>
          </div>
          <div>
            <button onClick={()=>setActiveTab('Attendance')} 
             type='button'
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
             ${activeTab === 'Attendance' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
            ><CalendarCheck className='w-4 mr-1' /> Attendance</button>
          </div>
          <div>
            <button onClick={()=>setActiveTab('Tasks')} 
             type='button'
           className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Tasks' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
            ><ClipboardList className='w-4 mr-1' /> Tasks</button>
          </div>
          <div>
            <button  onClick={()=>setActiveTab('Messages')} 
            type='button'
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
             ${activeTab === 'Messages' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
            ><MessageCircleMore className='w-4 mr-1' /> Messages</button>
          </div>
          <div>
            <button onClick={()=>setActiveTab('Files')} 
             type='button'
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Files' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
            ><FolderClosed className='w-4 mr-1' /> Files</button>
          </div>
          <div>
            <button onClick={()=>setActiveTab('Settings')} 
             type='button'
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === 'Settings' ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
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
              <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4'/> Edit</a>
              </div>
             <div className='grid grid-cols-2 gap-5 mt-3'>
               <div>
                <p className='text-xs text-gray-500'>Full Name</p>
                <p className='text-sm text-gray-800'>Sumit Kumar</p>
               </div>
              <div>
                <p className='text-xs text-gray-500'>Gender</p>
                <p className='text-sm text-gray-800'>Male </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Marital Status</p>
                <p className='text-sm text-gray-800'>Single </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Religion</p>
                <p className='text-sm text-gray-800'>Muslim </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Place of Birth</p>
                <p className='text-sm text-gray-800'>Kanpur </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Birth Date</p>
                <p className='text-sm text-gray-800'>10/06/2000 </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Blood Type</p>
                <p className='text-sm text-gray-800'>O+ </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Age</p>
                <p className='text-sm text-gray-800'>26</p>
              </div>
             </div>
            </div>
             {/*Contact Information end*/}
             {/* Address Information start */}
             <div className='bg-white p-4 rounded-lg border'>
              <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-medium'>Address Information</h3>
              <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4'/> Edit</a>
              </div>
              <div className='grid grid-cols-2 gap-5 mt-3'>
                <div>
                  <p className='text-xs text-gray-500'>Residential Address</p>
                  <p className='text-sm text-gray-800 mb-3'>4517 Washington Ave. Manchester, Kentucky 110033</p>
                  <p className='text-xs text-gray-500'>Note</p>
                  <p className='text-sm text-blue-400'>Add Note</p>
                </div>
                <div className='flex items-center justify-end'>
                  <p className='text-sm text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>
                 
                </div>
                <hr className='col-span-2' />
              <div>
                  <p className='text-xs text-gray-500'>Citizen ID Address</p>
                  <p className='text-sm text-gray-800 mb-3'>2715 Ash Dr. San Jose, South Dakota 83475</p>
                  <p className='text-xs text-gray-500'>Note</p>
                  <p className='text-sm text-blue-400'>Main entrance likely from Ash Drive. Check for a driveway or garage access. </p>
                </div>
                <div className='flex items-center justify-end'>
                  <p className='text-sm text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>
                 
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
              <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4'/> Edit</a>
              </div>
              <h4 className='text-sm font-medium my-2'>Personal Contact </h4>
               <div className=' grid grid-cols-2   gap-5 mt-3'>
                <div className='col-span-2 md:col-span-1'>
                  <p className='text-xs text-gray-500'>Phone</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>+91-7845123265</p>
                </div>
                <div className='col-span-2 md:col-span-1'>
                  <p className='text-xs text-gray-500'>Email</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>example@gmail.com</p>
                </div>
                <hr className='col-span-2'/>
                <div className='col-span-2'>
                  <h4 className='text-sm font-medium'>Personal Contact </h4>
                  <p className='text-xs my-2 text-gray-400'>Not Provided</p>
                </div>
                
               </div>
            </div>
             {/*Contact Information end */}
            {/* Student Overview start */}  
              <div className='bg-white p-4 rounded-lg border w-full'>
               <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-medium'>Student Overview</h3>
              <a href='#' className='flex items-center border px-2 py-1 rounded-lg text-sm'> <PencilLine className='w-4'/> Edit</a>
              </div>
              
               <div className='grid grid-cols-2 gap-5 mt-3'>
                <div>
                  <p className='text-xs text-gray-500'>Start Date</p>
                  <p className='text-sm text-gray-800'>2025-current (4 Years)</p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Role</p>
                  <p className='text-sm text-gray-800'>Student</p>
                </div>
                <hr className='col-span-2'/>
                <div>
                  <p className='text-xs text-gray-500'>Job Level</p>
                  <p className='text-sm text-gray-800'>Manager Level</p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Employee Status</p>
                  <p className='text-sm text-gray-800'>Fulltime</p>
                </div>
                 <div className='col-span-2'>
                  <p className='text-sm flex items-center text-blue-500'>View Contract <ChevronRight className="w-4" /></p>
                 </div>
               </div>
            </div>             
            {/* Student Overview end */}             

          </div>
        </div>
        </div>
        )}
        {activeTab === 'Attendance' && (
          <div  id='Attendence-details'>
        <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-3 mt-3'>
          
          <div className='col-span-3  gap-3 flex flex-col'>
             {/*Contact Information start*/}
            <div className='bg-white p-4 rounded-lg border'>
             
             <div className='grid grid-cols-1 gap-5'>
                <AttendanceCalendar/>
             </div>
            </div>
             
          </div>
         
        </div>
        </div>
        )}
        {activeTab === 'Tasks' && (
           <div  id='Tasks-details'>
        <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-3 mt-3'>
          
          <div className='col-span-2  gap-3 flex flex-col'>
             {/*Contact Information start*/}
            <div className='bg-white p-4 rounded-lg border'>
              <h3 className='text-lg font-medium'>Tasks Information</h3>
             <div className='grid grid-cols-2 gap-5 mt-3'>
               <div>
                <p className='text-xs text-gray-500'>Full Name</p>
                <p className='text-sm text-gray-800'>Sumit Kumar</p>
               </div>
              <div>
                <p className='text-xs text-gray-500'>Gender</p>
                <p className='text-sm text-gray-800'>Male </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Marital Status</p>
                <p className='text-sm text-gray-800'>Single </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Religion</p>
                <p className='text-sm text-gray-800'>Muslim </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Place of Birth</p>
                <p className='text-sm text-gray-800'>Kanpur </p>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Birth Date</p>
                <p className='text-sm text-gray-800'>10/06/2000 </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Blood Type</p>
                <p className='text-sm text-gray-800'>O+ </p>
              </div>
               <div>
                <p className='text-xs text-gray-500'>Age</p>
                <p className='text-sm text-gray-800'>26</p>
              </div>
             </div>
            </div>
             {/*Contact Information end*/}
             {/* Address Information start */}
             <div className='bg-white p-4 rounded-lg border'>
              <h3 className='text-lg font-medium'>Address Information</h3>
              <div className='grid grid-cols-2 gap-5 mt-3'>
                <div>
                  <p className='text-xs text-gray-500'>Residential Address</p>
                  <p className='text-sm text-gray-800 mb-3'>4517 Washington Ave. Manchester, Kentucky 110033</p>
                  <p className='text-xs text-gray-500'>Note</p>
                  <p className='text-sm text-blue-400'>Add Note</p>
                </div>
                <div className='flex items-center justify-end'>
                  <p className='text-sm text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>
                 
                </div>
                <hr className='col-span-2' />
              <div>
                  <p className='text-xs text-gray-500'>Citizen ID Address</p>
                  <p className='text-sm text-gray-800 mb-3'>2715 Ash Dr. San Jose, South Dakota 83475</p>
                  <p className='text-xs text-gray-500'>Note</p>
                  <p className='text-sm text-blue-400'>Main entrance likely from Ash Drive. Check for a driveway or garage access. </p>
                </div>
                <div className='flex items-center justify-end'>
                  <p className='text-sm text-blue-400 flex items-center'>View On Map <ChevronRight className="w-4" /></p>
                 
                </div>
                
              </div>
             </div>
             {/* Address Information end */}
          </div>
          <div className='col-span-1 gap-3 flex flex-col'>
            {/*Contact Information start */}
             <div className='bg-white p-4 rounded-lg border w-full'>
              <h3 className='text-md font-medium'>Contact Information</h3>
              <h4 className='text-sm font-medium my-2'>Personal Contact </h4>
               <div className='grid grid-cols-2 gap-5 mt-3'>
                <div>
                  <p className='text-xs text-gray-500'>Phone</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>+91-7845123265</p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Email</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>example@gmail.com</p>
                </div>
                <hr className='col-span-2'/>
                <div className='col-span-2'>
                  <h4 className='text-sm font-medium'>Personal Contact </h4>
                  <p className='text-xs my-2 text-gray-400'>Not Provided</p>
                </div>
                
               </div>
            </div>
             {/*Contact Information end */}
            {/* Student Overview start */}  
              <div className='bg-white p-4 rounded-lg border w-full'>
              <h3 className='text-md font-medium'>Student Overview</h3>
              
               <div className='grid grid-cols-2 gap-5 mt-3'>
                <div>
                  <p className='text-xs text-gray-500'>Start Date</p>
                  <p className='text-sm text-gray-800'>2025-current (4 Years)</p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Role</p>
                  <p className='text-sm text-gray-800'>Student</p>
                </div>
                <hr className='col-span-2'/>
                <div>
                  <p className='text-xs text-gray-500'>Job Level</p>
                  <p className='text-sm text-gray-800'>Manager Level</p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>Employee Status</p>
                  <p className='text-sm text-gray-800'>Fulltime</p>
                </div>
                 <div className='col-span-2'>
                  <p className='text-sm flex items-center text-blue-500'>View Contract <ChevronRight className="w-4" /></p>
                 </div>
               </div>
            </div>             
            {/* Student Overview end */}             

          </div>
        </div>
        </div>
        )}
        {activeTab === 'Messages' && (
          <div> Messages Section</div>
        )}
        {activeTab === 'Files' && (
          <div> Files Section</div>
        )}
        {activeTab === 'Settings' && (
          <div> Settings Section</div>
        )}
       
      </div>

    </>
  )
}

export default Profile

import { MapPin,Mail,PhoneCall } from 'lucide-react';
import userProfile from '../assets/userProfile.png';
const Profile = () => {
  return (
    <>
     <div className='bg-white p-4 border rounded-md'>
      <div className='grid grid-cols-1 md:grid-cols-1 gap-4 mb-4'>
        <div className='grid-cols-1  bg-white'>
            <h2 className='text-lg font-semibold mb-2'>Profile Information</h2>
            <p className='text-sm text-gray-600'>This is where user profile information will be displayed.</p>
          </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 flex-row'>
         <div className='col-span-1 bg-deep-purple-400 p-4 rounded border'>
          <div className='grid grid-flow-row py-10 gap-4'>
            <div className='w-full flex justify-center items-center flex-col gap-2'>
              <div className='w-40 h-40 rounded-full  flex justify-center items-center overflow-hidden'>
                 <img className='' src={userProfile} />
              </div>
              <div><h3 className='text-xl text-white '>Sunil Kushwaha</h3></div>
              <div><p className='text-sm text-white'>05/04/1996 ( 30 )</p></div>
            </div>
            <div className='w-full flex justify-center items-center flex-col gap-2 border-t border-gray-100 pt-4'>
              <div className='flex justify-between items-center w-full'>
                <div className='flex items-first gap-4 flex-col'> 
                   <div className='flex items-center '><span className=' bg-deep-purple-700 p-1 rounded-md inline-block mr-1'><MapPin className='w-4 h-4 text-white ' /></span> <span className='text-white'>Address : Azadpur Delhi India</span></div>
                   <div className='flex items-center '><span className=' bg-deep-purple-700 p-1 rounded-md inline-block mr-1'><Mail className='w-4 h-4 text-white ' /></span> <span className='text-white'>Email : sunilkushwaha066@gmail.com</span></div>
                   <div className='flex items-center '><span className=' bg-deep-purple-700 p-1 rounded-md inline-block mr-1'><PhoneCall className='w-4 h-4 text-white ' /></span> <span className='text-white'>Phone : +91-7827675008</span></div>
                   

                </div>
                </div>
            </div>
          </div>
         </div>
         <div className='col-span-2 bg-white p-4 rounded border'></div>
      </div>
     </div>
    </>
  )
}

export default Profile
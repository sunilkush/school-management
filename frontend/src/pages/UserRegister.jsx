import React from 'react'

const UserRegister = () => {
  return (
    <div>
      <div className='w-full h-96 flex gap-4 '>
        <div className='w-full md:w-1/2 bg-white p-5 '>
          <h2 className='text-2xl font-bold text-purple-600 mb-3'>Register</h2>
          <p className='text-gray-500'>Kindlly fill in this to Register</p>
          <div class="flex gap-4 mt-5">
            <div className='w-full md:w-1/2'>
               <label className="text-gray-400">Name</label>
               <input type='text' placeholder='Name' className='bg-white border rounded-sm px-3 py-2 w-full' />
            </div>
            <div className='w-full md:w-1/2'>
               <label className="text-gray-400">Phone No.</label>
               <input type='Number' placeholder='Mobile No.' className='bg-white border rounded-sm px-3 py-2 w-full' />
            </div>
          </div>
        </div>
        <div className='w-full md:w-1/2 bg-white p-5'></div>
      </div>
    </div>
  )
}

export default UserRegister

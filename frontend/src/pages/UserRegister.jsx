import React from 'react'
import RegisterFrom from '../components/forms/RegisterFrom'

const UserRegister = () => {
  return (
    <div>
      <div className='w-full  flex gap-4 '>
        <div className='w-full md:w-1/2 bg-white p-5 '>
         <RegisterFrom/>
        </div>
        <div className='w-full md:w-1/2 bg-white p-5'></div>
      </div>
    </div>
  )
}

export default UserRegister

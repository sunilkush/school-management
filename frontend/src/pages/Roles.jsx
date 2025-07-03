import React from 'react'
import AddRoleForm from '../components/forms/AddRoleForm'

const Roles = () => {
  return (
    <div>
      <div className='w-full flex gap-4'>
        <div className='w-full md:w-1/3 bg-white p-4 space-y-4  border rounded-md shadow-md mx-auto'>
          <AddRoleForm />
        </div>
        
      </div>
    </div>
  )
}

export default Roles

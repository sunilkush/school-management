import React, { useEffect, useState } from 'react'
import RegisterFrom from '../components/forms/RegisterFrom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllUser } from '../features/auth/authSlice'
import DataTable from 'react-data-table-component'

const UserRegister = () => {
  const dispatch = useDispatch()
  const { users, loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchAllUser())
  }, [dispatch])

  // Define table columns
  const columns = [
    {
      name: 'Avatar',
      selector: row => <img src={row.avatar || ''} alt="avatar" className="w-10 h-10 rounded-full" />,
      sortable: false,
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
    },
    {
      name: 'Role',
      selector: row => row.role?.name || '-',
      sortable: true,
    },
    {
      name: 'School',
      selector: row => row.school?.name || '-',
      sortable: true,
    },
    {
      name: 'Is Active',
      selector: row => (row.isActive ? 'Yes' : 'No'),
      sortable: true,
    },
  ]

  return (
    <div>
      <div className='w-full flex gap-4'>
        {/* Form Section */}
        <div className='w-full md:w-1/3 bg-white p-5'>
          <RegisterFrom />
        </div>

        {/* DataTable Section */}
        <div className='w-full md:w-2/3 bg-white p-5 overflow-x-auto'>
          <h2 className="text-xl font-bold mb-3">Registered Users</h2>
          <DataTable
            columns={columns}
            data={users}
            progressPending={loading}
            pagination
            highlightOnHover
            striped
            responsive
          />
        </div>
      </div>
    </div>
  )
}

export default UserRegister

import React, { useEffect } from 'react'
import RegisterFrom from '../components/forms/RegisterFrom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllUser } from '../features/auth/authSlice'

const UserRegister = () => {
  const dispatch = useDispatch()
  const { users, loading, error } = useSelector((state) => state.auth)
  console.log(users)

  useEffect(() => {
    dispatch(fetchAllUser())
  }, [dispatch])

  return (
    <div>
      <div className='w-full flex gap-4'>
        {/* Form Section */}
        <div className='w-full md:w-1/3 bg-white p-5'>
          <RegisterFrom />
        </div>

        {/* Users Table */}
        <div className='w-full md:w-2/3 bg-white p-5 overflow-x-auto'>
        <h2 className="text-xl font-bold mb-3">Register Users</h2>
          {loading ? (
            <p>User Fetching....</p>
          ) : (
            <table className='table-auto w-full border border-collapse border-gray-200'>
              <thead>
                <tr className='bg-gray-100 text-left'>
                  <th className='border px-4 py-2'>Avatar</th>
                  <th className='border px-4 py-2'>Name</th>
                  <th className='border px-4 py-2'>Email</th>
                  <th className='border px-4 py-2'>Role</th>
                  <th className='border px-4 py-2'>School</th>
                  <th className='border px-4 py-2'>Is Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className='border px-4 py-2 text-capitalize'><img width={40} height={40}  className="rounded-full" src={user.avatar}/></td>
                    <td className='border px-4 py-2 text-capitalize'>{user.name}</td>
                    <td className='border px-4 py-2 text-capitalize'>{user.email}</td>
                    <td className='border px-4 py-2 text-capitalize'>{user.role.name || '-'}</td>
                    <td className='border px-4 py-2 text-capitalize'>{user.school.name || '-'}</td>
                    <td className='border px-4 py-2 text-capitalize'>{user.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
         
        </div>
      </div>
    </div>
  )
}

export default UserRegister

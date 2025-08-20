import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllUser } from '../features/auth/authSlice';
import DataTable from 'react-data-table-component';
import RegisterForm from '../components/forms/RegisterFrom';
const UsersPage = () => {
  const { users, user: loggedInUser } = useSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState('all roles');
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);
  console.log(users)
  const filteredUsers = users
    ?.filter((u) => u.school?._id === loggedInUser?.school?._id)
    ?.filter((u) =>
      selectedRole === 'all' || selectedRole === 'all roles'
        ? true
        : u.role?.name?.toLowerCase() === selectedRole
    );

  const columns = [
    { name: '#', selector: (row, index) => index + 1, width: '60px' },
    { name: 'User ID', selector: (row) => row._id, sortable: true },
    { name: 'Name', selector: (row) => row.name, sortable: true },
    { name: 'Email', selector: (row) => row.email, sortable: true },
    { name: 'Role', selector: (row) => row.role?.name, sortable: true },
    { name: 'School', selector: (row) => row.school?.name, sortable: true },
  ];

  return (
    <div className="">
      <div className="bg-white p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">Users Management</h1>
        <div className='grid grid-cols-2'>
          <div className="mb-4">
            <label htmlFor="role" className="mr-2 font-medium text-sm text-gray-700">
              Filter by Role:
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="all roles">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="school admin">School Admins</option>
            </select>
          </div>
          <div>
            <button onClick={() => setIsModalOpen(true)} className='bg-blue-400 rounded-md text-white float-end px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' >Create Teacher / Staff</button>
          </div>
        </div>
        <DataTable
          columns={columns}
          className='capitalize'
          data={filteredUsers}
          pagination
          responsive
          striped
          highlightOnHover
          persistTableHead
          noDataComponent="No users found"
        />
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>

            <RegisterForm onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;

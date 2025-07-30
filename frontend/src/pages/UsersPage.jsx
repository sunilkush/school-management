import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllUser } from '../features/auth/authSlice';
import DataTable from 'react-data-table-component';

const UsersPage = () => {
  const { users, user: loggedInUser } = useSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState('all roles');
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

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

        <div className="mb-4">
          <label htmlFor="role" className="mr-2 font-medium text-sm text-gray-700">
            Filter by Role:
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all roles">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="school admin">School Admins</option>
          </select>
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
    </div>
  );
};

export default UsersPage;

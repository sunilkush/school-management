import React from 'react'
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUser, deleteUser } from '../features/auth/authSlice';
import DataTable from 'react-data-table-component';
import { FaUserCircle } from 'react-icons/fa';
const Admins = () => {
  const dispatch = useDispatch();
    const { users = [], loading, error, user: currentUser } = useSelector(
      (state) => state.auth
    );
  
    useEffect(() => {
      dispatch(fetchAllUser());
    }, [dispatch]);
  
    const handleEdit = (userId) => {
      if (userId === currentUser?._id) {
        alert('You cannot delete yourself.');
        return;
      }
      if (window.confirm('Are you sure you want to deactivate this user?')) {
        dispatch(deleteUser(userId)).then(() => dispatch(fetchAllUser()));
      }
    };
  
    const columns = [
      {
        name: 'Avatar',
        selector: (row) =>
          row.avatar ? (
            <img
              src={row.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="text-gray-400 text-2xl" />
          ),
        sortable: false,
      },
      {
        name: 'Name',
        selector: (row) => row.name,
        sortable: true,
      },
      {
        name: 'Email',
        selector: (row) => row.email,
        sortable: true,
      },
      {
        name: 'Role',
        selector: (row) => row.role?.name || '-',
        sortable: true,
      },
      {
        name: 'School',
        selector: (row) => row.school?.name || '-',
        sortable: true,
      },
      {
        name: 'Status',
        selector: (row) => (row.isActive ? 'Active' : 'Deactivated'),
        sortable: true,
      },
      {
        name: 'Actions',
        cell: (row) => (
          <button
            onClick={() => handleEdit(row._id)}
            className="text-red-600 hover:text-red-800 font-semibold"
          >
            Edit
          </button>
        ),
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ];
  
    // Filter users based on current role
    let filteredUsers = [];
    if (currentUser?.role?.name?.toLowerCase() === 'super admin') {
      filteredUsers = users.filter(
        (user) => user.role?.name?.toLowerCase() === 'school admin'
      );
    } else if (currentUser?.role?.name?.toLowerCase() === 'school admin') {
      filteredUsers = users.filter(
        (user) =>
          user.role?.name?.toLowerCase() !== 'super admin' &&
          user.role?.name?.toLowerCase() !== 'school admin'
      );
    }
  
  return (
    <div> <h2 className="text-xl font-bold mb-3">Registered Users</h2>
          <DataTable
            className={'min-w-full divide-y divide-gray-200 text-sm'}
            columns={columns}
            data={filteredUsers}
            progressPending={loading}
            pagination
            highlightOnHover
            striped
            responsive
          /></div>
  )
}

export default Admins
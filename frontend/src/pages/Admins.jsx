import React from 'react'
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUser, deleteUser,activeUser } from '../features/auth/authSlice';
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

  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      alert("You cannot change your own status.");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      dispatch(action === "deactivate" ? deleteUser({ id: user._id, isActive: false }) : activeUser({ id: user._id, isActive: true }))
        .then(() => dispatch(fetchAllUser()));
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
      selector: (row) => (
        <span className={` ${row.isActive ? 'bg-green-300 px-5 py-1 rounded-xl block text-white w-full' :'bg-red-300 px-5 py-1 rounded-xl block text-white w-full' }`}>
          {row.isActive ? 'Active' : 'Deactivated'}
          </span>),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`font-semibold ${row.isActive ? 'bg-red-600 hover:bg-red-800 px-3 py-1 text-white rounded-full w-full' : 'bg-green-600 hover:bg-green-800 px-3 py-1 rounded-full text-white w-full'}`}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
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
    <div>
      {error && (<p className='text-red-500'>{error}</p>)}
      <h2 className="text-xl font-bold mb-3">Registered Users</h2>
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
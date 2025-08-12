import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUser, deleteUser, activeUser } from '../features/auth/authSlice';
import DataTable from 'react-data-table-component';
import RegisterFrom from '../components/forms/RegisterFrom';
import { FaUserCircle } from 'react-icons/fa';

const Admins = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector(
    (state) => state.auth
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      alert('You cannot change your own status.');
      return;
    }

    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      dispatch(
        action === 'deactivate'
          ? deleteUser({ id: user._id, isActive: false })
          : activeUser({ id: user._id, isActive: true })
      ).then(() => dispatch(fetchAllUser()));
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
    },
    { name: 'Name', selector: (row) => row.name, sortable: true },
    { name: 'Email', selector: (row) => row.email, sortable: true },
    { name: 'Role', selector: (row) => row.role?.name || '-', sortable: true },
    { name: 'School', selector: (row) => row.school?.name || '-', sortable: true },
    {
      name: 'Status',
      selector: (row) => (
        <span
          className={`${
            row.isActive
              ? 'bg-green-300 px-5 py-1 rounded-xl block w-full'
              : 'bg-red-300 px-5 py-1 rounded-xl block w-full'
          }`}
        >
          {row.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`font-semibold ${
            row.isActive
              ? 'bg-red-600 hover:bg-red-800 px-3 py-1 text-white rounded-full w-full'
              : 'bg-green-600 hover:bg-green-800 px-3 py-1 rounded-full text-white w-full'
          }`}
        >
          {row.isActive ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

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
      {error && <p className="text-red-500">{error}</p>}
      <div className='grid grid-cols-2'>
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Admins</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg self-start justify-self-end hover:bg-blue-700 transition"
        >
          Add Admin
        </button>
      </div>
     

      {/* Data Table */}
      <DataTable
        className={'min-w-full divide-y divide-gray-200 text-sm mt-4'}
        columns={columns}
        data={filteredUsers}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
      />

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
           
            <RegisterFrom onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;

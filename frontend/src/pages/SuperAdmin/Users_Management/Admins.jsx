import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUser,
  deleteUser,
  activeUser,
} from "../../../features/authSlice";
import DataTable from "react-data-table-component";
import RegisterFrom from "../../../components/forms/RegisterFrom";
import { FaUserCircle } from "react-icons/fa";

const Admins = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error, user: currentUser } = useSelector(
    (state) => state.auth
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

  // ✅ Toggle status (with self-protection)
  const handleToggleStatus = (user) => {
    if (user._id === currentUser?._id) {
      alert("You cannot change your own status.");
      return;
    }

    const action = user.isActive ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      dispatch(
        user.isActive
          ? deleteUser({ id: user._id, isActive: false })
          : activeUser({ id: user._id, isActive: true })
      ).then(() => dispatch(fetchAllUser()));
    }
  };

  // ✅ Columns config
const columns = [
  {
    name: "Avatar",
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
    width: "80px",
  },
  { name: "Name", selector: (row) => row.name, sortable: true },
  { name: "Email", selector: (row) => row.email, sortable: true },
  { name: "Role", selector: (row) => row.role?.name || "-", sortable: true },
  { name: "School", selector: (row) => row.school?.name || "-", sortable: true },
  {
    name: "Status",
    selector: (row) => (
      <span
        className={`${
          row.isActive
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        } px-5 py-1 rounded-xl block text-center`}
      >
        {row.isActive ? "Active" : "Deactivated"}
      </span>
    ),
    sortable: true,
  },
  {
    name: "Actions",
    cell: (row) => (
      <button
        onClick={() => handleToggleStatus(row)}
        className={`font-semibold ${
          row.isActive
            ? "bg-red-600 hover:bg-red-800"
            : "bg-green-600 hover:bg-green-800"
        } px-3 py-1 text-white rounded-full w-full`}
      >
        {row.isActive ? "Deactivate" : "Activate"}
      </button>
    ),
    width: "150px",
  },
];
 

  // ✅ Filtered users based on role
  const filteredUsers = useMemo(() => {
    if (currentUser?.role?.name?.toLowerCase() === "super admin") {
      return users.filter(
        (u) => u.role?.name?.toLowerCase() === "school admin"
      );
    }
    if (currentUser?.role?.name?.toLowerCase() === "school admin") {
      return users.filter(
        (u) =>
          u.role?.name?.toLowerCase() !== "super admin" &&
          u.role?.name?.toLowerCase() !== "school admin"
      );
    }
    return [];
  }, [users, currentUser]);

  return (
    <div className="p-4">
      {error && <p className="text-red-500 mb-2">{error}</p>}

      {/* Header */}
      <div className="grid grid-cols-2 items-center">
        <h1 className="text-2xl font-bold text-blue-800">Admins</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-2 py-1 text-sm rounded-sm justify-self-end hover:bg-blue-700 transition"
        >
          Add Admin
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        className="mt-4"
        columns={columns}
        data={filteredUsers}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        noDataComponent="No admins found"
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-4 relative">
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

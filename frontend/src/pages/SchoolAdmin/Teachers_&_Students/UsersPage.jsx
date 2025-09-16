import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUser } from "../../../features/authSlice";
import DataTable from "react-data-table-component";
import RegisterForm from "../../../components/forms/RegisterFrom"; // ✅ check file name
import { useNavigate } from "react-router-dom";

const UsersPage = () => {
  const { users, user: loggedInUser } = useSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState("all roles");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // logged-in user's role
  const role =
    loggedInUser?.role?.name ||
    JSON.parse(localStorage.getItem("user"))?.role?.name;

  useEffect(() => {
    dispatch(fetchAllUser());
  }, [dispatch]);

  // ✅ Role-based filtering
  const filteredUsers = users?.filter((u) => {
    const sameSchool = u.school?._id === loggedInUser?.school?._id;

    if (role?.toLowerCase() === "teacher") {
      return sameSchool && u.role?.name?.toLowerCase() === "student";
    }

    if (role?.toLowerCase() === "school admin") {
      const roleMatch =
        selectedRole === "all" || selectedRole === "all roles"
          ? ["teacher", "school admin"].includes(u.role?.name?.toLowerCase())
          : u.role?.name?.toLowerCase() === selectedRole;
      return sameSchool && roleMatch;
    }

    return false;
  });

  const columns = [
    { name: "#", selector: (row, index) => index + 1, width: "60px" },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Role", selector: (row) => row.role?.name, sortable: true },
    { name: "School", selector: (row) => row.school?.name, sortable: true },
    { name: "Action", selector: (row) => <>
    {console.log(row)} 
    <button 
      className="bg-green-500 text-white px-2 py-1 rounded mr-2" 
      onClick={() => navigate(`/dashboard/schooladmin/users/employee-from?id=${row._id}`)}
    >
      Edit
    </button>
    </>, sortable: true },
  ];

  return (
    <div>
      <div className="bg-white p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">
          {role?.toLowerCase() === "teacher"
            ? "Students List"
            : "Teachers & Staff List"}
        </h1>

        {role?.toLowerCase() === "school admin" && (
          <div className="grid grid-cols-2 mb-4">
            <div>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all roles">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="school admin">School Admins</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-400 rounded-md text-white float-end px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Teacher / Staff
              </button>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          className="capitalize"
          data={filteredUsers}
          pagination
          responsive
          striped
          highlightOnHover
          persistTableHead
          noDataComponent="No users found"
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
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

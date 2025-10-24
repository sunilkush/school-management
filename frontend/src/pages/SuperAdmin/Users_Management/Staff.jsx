import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataTable from 'react-data-table-component';
import { fetchAllUser ,  deleteUser,
  activeUser,} from '../../../features/authSlice';
import { fetchSchools } from '../../../features/schoolSlice';
import { Select } from 'antd';
import 'antd/dist/reset.css';

const { Option } = Select;

const Staff = () => {
  const dispatch = useDispatch();
  const { users = [], loading, error ,user: currentUser} = useSelector((state) => state.auth);
  const { schools = [] } = useSelector((state) => state.school);

  const [selectedSchool, setSelectedSchool] = useState('All');

  useEffect(() => {
    dispatch(fetchAllUser());
    dispatch(fetchSchools());
  }, [dispatch]);

  // Filter only teachers
  let staffs = users.filter((user) => user?.role?.name === "Staff");

  // Filter teachers by selected school name
  if (selectedSchool !== 'All') {
    staffs = staffs.filter(
      (teacher) => teacher.school?.name === selectedSchool
    );
  }

  // Get unique school names for dropdown
  const schoolNames = ['All', ...new Set(schools.map((s) => s.name).filter(Boolean))];
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
  const columns = [
    { name: '#', selector: (row, index) => index + 1, sortable: true, width: '70px' },
    { name: 'Name', selector: (row) => row.name, sortable: true },
    { name: 'Email', selector: (row) => row.email, sortable: true },
    { name: 'School', selector: (row) => row.school?.name || '—' },
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

  if (loading) return <div className="text-center py-6 text-blue-600 font-semibold">Loading...</div>;
  if (error) return <div className="text-center py-6 text-red-600">Error: {error}</div>;

  return (
    <div className=" min-h-screen">
      <h1 className="text-md font-semibold text-gray-800 mb-4">All Staffs</h1>

      {/* School Filter */}
      <div className="mb-4 flex items-center space-x-4">
        <label className="font-small text-gray-700 text-sm">Filter by School:</label>
        <Select
          value={selectedSchool}
          onChange={setSelectedSchool}
          style={{ width: 200 }}
        >
          {schoolNames.map((name) => (
            <Option key={name} value={name}>
              {name}
            </Option>
          ))}
        </Select>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-3">
        <DataTable
          columns={columns}
          data={staffs}
          pagination
          highlightOnHover
          striped
          dense
          noDataComponent="No staffs found"
          customStyles={{
            headCells: {
              style: {
                fontWeight: 'bold',
                backgroundColor: '#f9fafb',
                color: '#374151',
                fontSize: '14px',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Staff;

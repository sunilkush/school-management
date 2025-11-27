import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchoolReports } from "../../../features/reportSlice.js";
import { Select, Table, Button, Card } from "antd";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";

const { Option } = Select;

const SchoolReports = () => {
  const dispatch = useDispatch();

  const { schoolReports, loading } = useSelector((state) => state.reports);
  const { schools } = useSelector((state) => state.school);
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);

  const [schoolId, setSchoolId] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYearId, setAcademicYearId] = useState(null);

  // Load all schools
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // When school changes
  const handleSchoolChange = (id) => {
    setSchoolId(id);

    const selectedSchool = schools.find((s) => s._id === id);

    setAcademicYears(selectedSchool?.academicYears || []);

    setAcademicYearId(null); // reset selection

    dispatch(fetchActiveAcademicYear(id)); // fetch active year
    return setAcademicYearId(selectedAcademicYear?._id || null);
  };

  // Auto-select active academic year
  useEffect(() => {
    if (
      academicYears.length > 0 &&
      selectedAcademicYear?._id &&
      academicYears.some((y) => y._id === selectedAcademicYear._id)
    ) {
      setAcademicYearId(selectedAcademicYear._id);
    }
  }, [academicYears, selectedAcademicYear]);

  // Fetch reports only when both selected
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSchoolReports({ schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  /* Convert API response to array for Table */
  const tableData = schoolReports ? [{ ...schoolReports, key: schoolReports.academicYearId }] : [];

const columns = [
  {
    title: "Report Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Admins",
    key: "adminCount",
    render: (_, record) => record.summary?.adminCount || 0,
    
  },
  {
    title: "Teachers",
    key: "teacherCount",
    render: (_, record) => record.summary?.teacherCount || 0,
  },
  {
    title: "Students",
    key: "studentCount",
    render: (_, record) => record.summary?.studentCount || 0,
  },
  {
    title: "Date Created",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
  },
  {
    title: "Actions",
    key: "actions",
    render: (record) => (
      <Button type="primary" onClick={() => console.log(record)}>
        View
      </Button>
    ),
  },
];



  return (
    <Card className="shadow-lg">
      <h1 className="text-xl font-semibold mb-4">School Reports</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* School Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Select School</label>
          <Select
            placeholder="Select School"
            className="w-full"
            value={schoolId}
            onChange={handleSchoolChange}
          >
            {schools.map((school) => (
              <Option key={school._id} value={school._id}>
                {school.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Academic Year */}
        <div className="hidden">
          <label className="block mb-1 font-medium">Select Academic Year</label>
          <Select
            placeholder="Select Academic Year"
            className="w-full"
            disabled={!academicYears.length}
            value={academicYearId}
            onChange={(value) => setAcademicYearId(value)}
          >
            {academicYears.map((yr) => (
              <Option key={yr._id} value={yr._id}>
                {yr.name}
              </Option>
            ))}
          </Select>
        </div>

      </div>

      {/* Table */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={tableData}
        rowKey="_id"
        bordered
      />
    </Card>
  );
};

export default SchoolReports;

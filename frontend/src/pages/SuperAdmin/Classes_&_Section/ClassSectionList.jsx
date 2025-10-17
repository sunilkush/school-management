import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchSection } from "../../../features/sectionSlice";
import { Select, Spin, Table } from "antd";

const SchoolClassSectionFilter = () => {
  const dispatch = useDispatch();

  const { schools, loading: schoolLoading } = useSelector((state) => state.school);
  const { classList, loading: classLoading } = useSelector((state) => state.class);
  const { sectionList, loading: sectionLoading } = useSelector((state) => state.section);

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // ✅ Load all schools on mount
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ When school changes, fetch related classes & sections
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchAllClasses({ schoolId: selectedSchool }));
      dispatch(fetchSection({ schoolId: selectedSchool }));
      setSelectedClass(null); // reset selected class
    }
  }, [selectedSchool, dispatch]);

  // Filter sections based on selected class
  const filteredSections = selectedClass
    ? sectionList.filter((sec) => String(sec.classId?._id) === String(selectedClass))
    : sectionList;

  // Table Columns
  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      key: "className",
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      key: "sectionName",
    },
  ];

  // Table Data
  const tableData = filteredSections.map((sec) => ({
    key: sec._id,
    className: sec.classId?.name || "N/A",
    sectionName: sec.name,
  }));

  return (
    <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
      {/* Select School */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">Select School</label>
        <Select
          placeholder="Choose School"
          loading={schoolLoading}
          className="w-full"
          onChange={(value) => setSelectedSchool(value)}
          value={selectedSchool}
          allowClear
        >
          {schools.map((s) => (
            <Select.Option key={s._id} value={s._id}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Select Class */}
      <div>
        <label className="block font-medium text-gray-700 mb-2">Select Class</label>
        {classLoading ? ( 
          <Spin />
        ) : (
          <Select
            placeholder="Choose Class"
            disabled={!selectedSchool}
            className="w-full"
            onChange={(value) => setSelectedClass(value)}
            value={selectedClass}
            allowClear
          >
            {classList.map((c) => (
              <Select.Option key={c._id} value={c._id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        )}
      </div>

      {/* Sections Table */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-2">Sections</h2>
        {sectionLoading ? (
          <Spin />
        ) : (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
          />
        )}
      </div>
    </div>
  );
};

export default SchoolClassSectionFilter;

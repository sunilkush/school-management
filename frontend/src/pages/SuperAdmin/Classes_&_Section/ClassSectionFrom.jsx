import React, { useEffect, useState } from "react";
import { Select, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createClass } from "../../../features/classSlice";
import { createSection } from "../../../features/sectionSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";

function ClassSectionForm() {
  const dispatch = useDispatch();

  // Redux state se school aur academic year
  const { schools } = useSelector((state) => state.school);
  const { activeYear } = useSelector((state) => state.academicYear);

  // Dummy classes and sections
  const classes = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
  const sections = ["A", "B", "C", "D", "E", "F"];

  // Local states
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  // Reset
  const resetClassForm = () => setSelectedClasses([]);
  const resetSectionForm = () => setSelectedSections([]);

  // ✅ Save Classes
  const handleSaveClasses = () => {
    if (!selectedSchool || !activeYear?._id) {
      alert("Please select school and academic year!");
      return;
    }

    selectedClasses.forEach((cls) => {
      const payload = {
        schoolId: selectedSchool,
        academicYearId: activeYear._id,
        name: `Class ${cls}`,
      };
      console.log("Creating Class with payload:", payload);
      dispatch(createClass(payload));
    });

    resetClassForm();
  };

  // ✅ Save Sections
  const handleSaveSections = () => {
    if (!selectedSchool || !activeYear?._id) {
      alert("Please select school and academic year!");
      return;
    }

    selectedSections.forEach((sec) => {
      const payload = {
        schoolId: selectedSchool,
        academicYearId: activeYear._id,
        name: sec,
      };
      console.log("Creating Section with payload:", payload);
      dispatch(createSection(payload));
    });

    resetSectionForm();
  };

  // ✅ Load Schools
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ Load Active Academic Year for Selected School
  console.log("Selected School:", selectedSchool);
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchActiveAcademicYear(selectedSchool));
    }
  }, [dispatch, selectedSchool]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4">
      {/* Create Class */}
      <div className="border rounded-2xl p-5 bg-white shadow-md space-y-4">
        <h2 className="text-lg font-semibold">Create Class</h2>

        {/* School */}
        <div>
          <label className="text-sm font-medium">School Name</label>
          <select
            className="border p-2 w-full rounded-lg text-sm mt-1"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">Select School</option>
            {schools?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label className="text-sm font-medium">Academic Year</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1" disabled>
            <option>{activeYear?.name || "Select Academic Year"}</option>
          </select>
        </div>

        {/* Class Name */}
        <div>
          <label className="text-sm font-medium">Class Name</label>
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Select Classes"
            value={selectedClasses}
            onChange={setSelectedClasses}
            options={classes.map((cls) => ({
              label: `Class ${cls}`,
              value: cls,
            }))}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <Button onClick={resetClassForm}>Reset</Button>
          <Button type="primary" onClick={handleSaveClasses}>
            Save
          </Button>
        </div>
      </div>

      {/* Create Section */}
      <div className="border rounded-2xl p-5 bg-white shadow-md space-y-4">
        <h2 className="text-lg font-semibold">Create Section</h2>

        {/* School */}
        <div>
          <label className="text-sm font-medium">School Name</label>
          <select
            className="border p-2 w-full rounded-lg text-sm mt-1"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">Select School</option>
            {schools?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label className="text-sm font-medium">Academic Year</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1" disabled>
            <option>{activeYear?.name || "Select Academic Year"}</option>
          </select>
        </div>

        {/* Section Name */}
        <div>
          <label className="text-sm font-medium">Section Name</label>
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Select Sections"
            value={selectedSections}
            onChange={setSelectedSections}
            options={sections.map((sec) => ({ label: sec, value: sec }))}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <Button onClick={resetSectionForm}>Reset</Button>
          <Button type="primary" danger onClick={handleSaveSections}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClassSectionForm;

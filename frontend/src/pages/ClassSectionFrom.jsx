import React, { useState } from "react";
import { Select, Button } from "antd";

function ClassSectionForm() {
  const classes = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
  const sections = ["A", "B", "C", "D", "E", "F"];

  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  const resetClassForm = () => setSelectedClasses([]);
  const resetSectionForm = () => setSelectedSections([]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4">
      {/* Create Class */}
      <div className="border rounded-2xl p-5 bg-white shadow-md space-y-4">
        <h2 className="text-lg font-semibold">Create Class</h2>

        <div>
          <label className="text-sm font-medium">School Name</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1">
            <option>Select School</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Academic Year</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1">
            <option>Select Academic Year</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Class Name</label>
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Select Classes"
            value={selectedClasses}
            onChange={setSelectedClasses}
            options={classes.map((cls) => ({ label: `Class ${cls}`, value: cls }))}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-3">
          <Button onClick={resetClassForm}>Reset</Button>
          <Button type="primary">Save</Button>
        </div>
      </div>

      {/* Create Section */}
      <div className="border rounded-2xl p-5 bg-white shadow-md space-y-4">
        <h2 className="text-lg font-semibold">Create Section</h2>

        <div>
          <label className="text-sm font-medium">School Name</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1">
            <option>Select School</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Academic Year</label>
          <select className="border p-2 w-full rounded-lg text-sm mt-1">
            <option>Select Academic Year</option>
          </select>
        </div>

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
          <Button type="primary" danger>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClassSectionForm;

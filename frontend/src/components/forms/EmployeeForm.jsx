import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

const EmployeeForm = () => {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("id"); // ✅ capture ?id from URL
  console.log("Employee ID from URL:", employeeId);

  const { user: loggedInUser } = useSelector((state) => state.auth);
  const schoolId = loggedInUser?.school?._id;

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNo: "",
    gender: "",
    dateOfBirth: "",
    education: "",
    experience: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    department: "",
    designation: "",
    employmentType: "",
    joinDate: "",
    basicPay: 0,
    allowances: 0,
    deductions: 0,
    assignedClasses: [],
    notes: "",
  });

  const classes = [
    { _id: "class1", name: "Class 1" },
    { _id: "class2", name: "Class 2" },
  ];

  useEffect(() => {
    if (employeeId) {
      console.log("Fetch employee details for:", employeeId);
    }
  }, [employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClassAssign = (index, field, value) => {
    const updated = [...formData.assignedClasses];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, assignedClasses: updated }));
  };

  const addClassAssign = () => {
    setFormData((prev) => ({
      ...prev,
      assignedClasses: [
        ...prev.assignedClasses,
        { classId: "", subjects: [], schedule: [] },
      ],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      schoolId,
      salary: {
        basicPay: formData.basicPay,
        allowances: formData.allowances,
        deductions: formData.deductions,
      },
    };
    console.log("Submit payload:", payload);

    if (employeeId) {
      console.log("Update existing employee:", employeeId);
    } else {
      console.log("Create new employee");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-full mx-auto bg-white shadow-md rounded-lg p-6 mt-1">
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        Employee Details
      </h1>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
          <p>Fill in the employee's basic details below.</p>
           <form className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Full Name */}
        <div>
          <label className={labelClass}>
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter full name"
            className={inputClass}
          />
        </div>

        

        

        {/* Role */}
        <div>
         <label className={labelClass}>
            Role <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="Enter Role"
             className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
           <label className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Enter email address"
            className={inputClass}
          />
        </div>

        {/* Address */}
        <div >
          <label className={labelClass}>
            Avatar <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="Enter full address"
           className={inputClass}
          ></textarea>
        </div>
      </form>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
          <p className="text-sm text-gray-600 mb-4">
            Fill in the employee's basic details below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Phone No</label>
                <input
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Education</label>
                <input
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Experience</label>
                <input
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["street", "city", "state", "zipCode", "country"].map((key) => (
                <div key={key}>
                  <label className={labelClass}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <input
                    name={`address.${key}`}
                    value={formData.address[key]}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            {/* Job & Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Department</label>
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Join Date</label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Basic Pay</label>
                <input
                  type="number"
                  name="basicPay"
                  value={formData.basicPay}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Allowances</label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Deductions</label>
                <input
                  type="number"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Assigned Classes */}
            {formData.designation.toLowerCase() === "teacher" && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Assigned Classes</h2>
                {formData.assignedClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2"
                  >
                    <select
                      value={cls.classId}
                      onChange={(e) =>
                        handleClassAssign(idx, "classId", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={cls.subjects.join(", ")}
                      onChange={(e) =>
                        handleClassAssign(
                          idx,
                          "subjects",
                          e.target.value.split(",")
                        )
                      }
                      className={inputClass}
                      placeholder="Subjects (comma separated)"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addClassAssign}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-2"
                >
                  Add Class
                </button>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className={inputClass}
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded mt-4"
            >
              Save Employee
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;

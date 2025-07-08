import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastStudent } from "../../features/students/studentSlice";
import { generateNextRegNumber } from "../../utils/genreateRegisterNo";
import { School } from "lucide-react";

const Tab = ({ label, isActive, onClick }) => (
  <button
    className={`px-4 py-2 rounded-t-md border-b-2 font-medium text-sm focus:outline-none transition-all duration-150 ${
      isActive
        ? "bg-white border-purple-600 text-purple-600"
        : "bg-gray-100 border-transparent text-gray-500 hover:text-purple-600"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const AdmissionForm = () => {
  const [activeTab, setActiveTab] = useState("Student Info");
  const { lastStudent, loading } = useSelector((state) => state.students);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    password: "",
    role: "student",
    schoolId: user?.school?._id || "",
    classId: "",
    section: "",
    registrationNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    feeDiscount: 0,
    mobileNumber: "",
    picture: null,

    dateOfBirth: "",
    birthFormId: "",
    orphan: "",
    gender: "",
    caste: "",
    isOSC: "",
    identificationMark: "",
    previousSchool: "",
    religion: "",
    bloodGroup: "",
    previousId: "",
    family: "",
    disease: "",
    notes: "",
    siblings: 0,
    address: "",

    fatherName: "",
    fatherNationalId: "",
    fatherOccupation: "",
    fatherEducation: "",
    fatherMobile: "",
    fatherProfession: "",
    fatherIncome: 0,

    motherName: "",
    motherNationalId: "",
    motherOccupation: "",
    motherEducation: "",
    motherMobile: "",
    motherProfession: "",
    motherIncome: 0,
  });

  useEffect(() => {
    dispatch(fetchLastStudent());
  }, [dispatch]);
  useEffect(() => {
    if (lastStudent) {
      const nextReg = generateNextRegNumber(lastStudent.registrationNumber);
      setFormData((prev) => ({
        ...prev,
        registrationNumber: nextReg,
        role: lastStudent.role || "student", // ✅ Set role
      }));
    } else if (!loading) {
      setFormData((prev) => ({
        ...prev,
        registrationNumber: "REG2025-101", // default for first student
        role: "student",
      }));
    }
  }, [lastStudent, loading]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    // Dispatch or API call here
    console.log("FormData ready:", data);
  };

  const inputClass =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500";
  const tabList = ["Student Info", "Other Info", "Father Info", "Mother Info"];
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Student Admission Form</h1>

      {/* Tabs */}
      <div className="flex space-x-2 border-b mb-6">
        {tabList.map((tab) => (
          <Tab
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "Student Info" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Student Name</label>
              <input
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Class</label>
              <input
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Section</label>
              <input
                name="section"
                value={formData.section}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Registration No.</label>
              <input
                name="registrationNumber"
                value={formData.registrationNumber}
                disabled
                className={`${inputClass} bg-gray-100`}
              />
            </div>
            <div>
              <label className={labelClass}>Admission Date</label>
              <input
                name="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fee Discount (%)</label>
              <input
                name="feeDiscount"
                type="number"
                value={formData.feeDiscount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Photo</label>
              <input
                name="picture"
                type="file"
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {activeTab === "Other Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date Of Birth</label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={inputClass}
                placeholder="Date of Birth"
              />
            </div>
            <div>
              <label className={labelClass}>Student Birth Form ID / NIC</label>
              <input
                name="birthFormId"
                placeholder="Student Birth Form ID / NIC"
                value={formData.birthFormId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Orphan</label>
              <select
                name="orphan"
                value={formData.orphan}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Orphan Student</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cast</label>
              <input
                name="cast"
                placeholder="Cast"
                value={formData.cast}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>OSC</label>
              <input
                name="osc"
                placeholder="OSC"
                value={formData.osc}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Any Identification Mark?</label>
              <input
                name="identificationMark"
                placeholder="Any Identification Mark?"
                value={formData.identificationMark}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Previous School</label>
              <input
                name="previousSchool"
                placeholder="Previous School"
                value={formData.previousSchool}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Religion</label>
              <input
                name="religion"
                placeholder="Religion"
                value={formData.religion}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Blood Group</label>
              <input
                name="bloodGroup"
                placeholder="Blood Group"
                value={formData.bloodGroup}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Previous ID / Board Roll No</label>
              <input
                name="previousId"
                placeholder="Previous ID / Board Roll No"
                value={formData.previousId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Select Family</label>
              <input
                name="family"
                placeholder="Select Family"
                value={formData.family}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Disease If Any?</label>
              <input
                name="disease"
                placeholder="Disease If Any?"
                value={formData.disease}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Any Additional Note</label>
              <input
                name="notes"
                placeholder="Any Additional Note"
                value={formData.notes}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Total Siblings</label>
              <input
                name="siblings"
                placeholder="Total Siblings"
                value={formData.siblings}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className={inputClass}
                rows={3}
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === "Father Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="fatherName"
                placeholder="Father Name"
                value={formData.fatherName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>National ID</label>
              <input
                name="fatherNID"
                placeholder="Father National ID"
                value={formData.fatherNID}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <input
                name="fatherOccupation"
                placeholder="Occupation"
                value={formData.fatherOccupation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Education</label>
              <input
                name="fatherEducation"
                placeholder="Education"
                value={formData.fatherEducation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile No</label>
              <input
                name="fatherMobile"
                placeholder="Mobile No"
                value={formData.fatherMobile}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Profession</label>
              <input
                name="fatherProfession"
                placeholder="Profession"
                value={formData.fatherProfession}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Income</label>
              <input
                name="fatherIncome"
                placeholder="Income"
                value={formData.fatherIncome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {activeTab === "Mother Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                name="motherName"
                placeholder="Mother Name"
                value={formData.motherName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>National ID</label>
              <input
                name="motherNID"
                placeholder="Mother National ID"
                value={formData.motherNID}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <input
                name="motherOccupation"
                placeholder="Occupation"
                value={formData.motherOccupation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Education</label>
              <input
                name="motherEducation"
                placeholder="Education"
                value={formData.motherEducation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile No</label>
              <input
                name="motherMobile"
                placeholder="Mobile No"
                value={formData.motherMobile}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Profession</label>
              <input
                name="motherProfession"
                placeholder="Profession"
                value={formData.motherProfession}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Income</label>
              <input
                name="motherIncome"
                placeholder="Income"
                value={formData.motherIncome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="text-right pt-6">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
          >
            Submit Admission
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdmissionForm;

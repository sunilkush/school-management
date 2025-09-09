import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastStudent, createStudent } from "../../features/students/studentSlice";

import { fetchClassSections } from "../../features/classes/classSectionSlice";


const Tab = ({ label, isActive, onClick }) => (
  <button
    className={`px-4 py-2 rounded-t-md border-b-2 font-medium text-sm focus:outline-none transition-all duration-150 ${isActive
      ? "bg-white border-purple-600 text-blue-600"
      : "bg-gray-100 border-transparent text-gray-500 hover:text-blue-600"
      }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const AdmissionForm = () => {

  const [activeTab, setActiveTab] = useState("Student Info");
  const { lastStudent } = useSelector((state) => state.students);

  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.school?._id
  const { mappings = [], } = useSelector((state) => state.classSection || {});
  const selectAcademicYear = localStorage.getItem("selectedAcademicYear");
  const academicYearObj = selectAcademicYear ? JSON.parse(selectAcademicYear) : null;
  const academicYearId = academicYearObj?._id || "";
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    password: "",
    role: "student",
    schoolId: schoolId || "",
    classId: "",
    section: "",
    registrationNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    feeDiscount: 0,
    mobileNumber: "",
    picture: null,
    academicYearId,
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
    fatherNID: "",
    fatherOccupation: "",
    fatherEducation: "",
    fatherMobile: "",
    fatherProfession: "",
    fatherIncome: 0,

    motherName: "",
    motherNID: "",
    motherOccupation: "",
    motherEducation: "",
    motherMobile: "",
    motherProfession: "",
    motherIncome: 0,
  });

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchLastStudent({ schoolId, academicYearId }));
    }
    if (schoolId) {
      dispatch(fetchClassSections({ schoolId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
    if (lastStudent?.registrationNumber) {
      setFormData((prev) => ({
        ...prev,
        registrationNumber: lastStudent.registrationNumber,
        role: "student",
      }));
    }
  }, [lastStudent]);

  const handleChange = (e) => {
    
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
    if (name === "classId") {
  const [classId, sectionId] = value.split("|");
  setFormData((prev) => ({ ...prev, classId, section: sectionId }));
}else {
      setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    }
    
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    const studentData = Object.fromEntries(data);
    dispatch(createStudent(studentData));
    dispatch(fetchLastStudent({ schoolId, academicYearId })); // get next reg no
  };

  const inputClass =
    "w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs";

  const labelClass = "block text-xs font-medium text-gray-700 mb-1";
  const tabList = ["Student Info", "Other Info", "Father Info", "Mother Info"];
  const tabFields = {
    "Student Info": ["studentName", "email", "password", "classId", "admissionDate"],
    "Other Info": ["dateOfBirth", "birthFormId", "gender", "religion"],
    "Father Info": ["fatherName", "fatherOccupation", "fatherMobile"],
    "Mother Info": ["motherName", "motherOccupation", "motherMobile"],
  };
  const isTabValid = () => {
    const requiredFields = tabFields[activeTab] || [];
    return requiredFields.every((field) => {
      const value = formData[field];
      return value !== undefined && value !== null && value.toString().trim() !== "";
    });
  };
  const handleNext = () => {
    const currentIndex = tabList.indexOf(activeTab);
    if (currentIndex < tabList.length - 1) {
      setActiveTab(tabList[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabList.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabList[currentIndex - 1]);
    }
  };
  return (
    <div className="max-w-full mx-auto bg-white shadow-md rounded-lg p-6">
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
          <div className="grid md:grid-cols-3 gap-4">
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
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="">Select Class</option>
                {console.log(mappings)}
                {mappings && mappings.length > 0 ? (
                  mappings.map((cls) => (
                    <option key={cls._id} value={`${cls.class._id}|${cls.section._id}`}>
                    {cls.class.name} - {cls.section.name}
                  </option>
                  ))
                ) : (
                  <option disabled>No Classes Available</option>
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Registration No.</label>

              <input
                name="registrationNumber"
                value={formData.registrationNumber || ""}
                disabled
                className={`${inputClass} bg-gray-100`}
              />


              {lastStudent && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last Student:({lastStudent?.lastStudent?.registrationNumber})
                   
                  </p>
                )}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="fatherNationalId"
                placeholder="Father National ID"
                value={formData.fatherNationalId}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="motherNationalId"
                placeholder="Mother National ID"
                value={formData.motherNationalId}
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

        <div className="flex justify-between pt-6">
          {tabList.indexOf(activeTab) > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded"
            >
              Previous
            </button>
          )}

          {tabList.indexOf(activeTab) < tabList.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isTabValid()}
              className={`${isTabValid() ? "bg-blue-600 hover:bg-purple-700" : "bg-gray-300 cursor-not-allowed"
                } text-white px-6 py-2 rounded`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isTabValid()}
              className={`${isTabValid() ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
                } text-white px-6 py-2 rounded`}
            >
              Submit Admission
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default AdmissionForm;

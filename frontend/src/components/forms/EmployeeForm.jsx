import {
  EllipsisVertical,
  MailPlus,
  User,
  CalendarCheck,
  ClipboardList,
  MessageCircleMore,
  Settings,
  FolderClosed,
} from "lucide-react";
import { useEffect, useState } from "react";
import userProfile from "../../assets/userProfile.png";
import AttendanceCalendar from "../../pages/AttendanceCalendar";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from "../../features/auth/authSlice";
import { Select, DatePicker, Input, Button, message } from "antd";
import dayjs from "dayjs";
import { createEmployee } from "../../features/employee/employeeSlice";
import { fetchActiveAcademicYear } from "../../features/academicYear/academicYearSlice";
import { fetchAllSubjects } from "../../features/subject/subjectSlice";

const { Option } = Select;

const EmployeeForm = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  const { subjectList } = useSelector((state) => state.subject);
 const { loading, error, success, response } =
  useSelector((state) => state.employee) || {};

  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState("Profile");

  const [formData, setFormData] = useState({
    userId: employeeId,
    schoolId: schoolId,
    academicYearId: academicYearId,
    phoneNo: "",
    maritalStatus: "",
    gender: "",
    dateOfBirth: "",
    bloodType: "",
    religion: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    idProof: "",
    CitizenAddress: "",
    department: "",
    designation: "",
    employeeStatus: "",
    joinDate: "",
    salaryId: "",
    qualification: [],
    experience: "",
    subjects: [],
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
    panNumber: "",
    pfNumber: "",
    esiNumber: "",
    notes: "",
  });

  const qualifications = [
    { id: 1, name: "High School / 10th" },
    { id: 2, name: "Intermediate / 12th" },
    { id: 3, name: "Diploma" },
    { id: 4, name: "Bachelor's Degree" },
    { id: 5, name: "Master's Degree" },
    { id: 6, name: "PhD / Doctorate" },
    { id: 7, name: "ITI / Trade Course" },
    { id: 8, name: "Professional Certification" },
    { id: 9, name: "Other" },
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "RH"];
  const martialStatuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
    "Registered Partnership",
  ];
  const religions = [
    "Hindu",
    "Muslim",
    "Christian",
    "Sikh",
    "Buddhist",
    "Jain",
    "Other",
  ];
  const cities = [
    "Delhi",
    "Mumbai",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur",
  ];
  const states = [
    "Andhra Pradesh",
    "Bihar",
    "Maharashtra",
    "Uttar Pradesh",
    "Tamil Nadu",
    "Karnataka",
    "Rajasthan",
    "West Bengal",
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const res = await dispatch(createEmployee(formData));
    if (res?.payload?.success) {
      message.success(res.payload.message || "Employee created successfully!");
    } else {
      message.error(
        res?.payload?.errors || "Something went wrong while creating employee"
      );
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      schoolId: schoolId || prev.schoolId,
      academicYearId: academicYearId || prev.academicYearId,
    }));
  }, [schoolId, academicYearId]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllSubjects({ schoolId, academicYearId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
    if (employeeId) {
      dispatch(getUserById(employeeId));
    }
  }, [dispatch, employeeId, schoolId, academicYearId]);

  return (
    <div className=" min-h-screen">
       {/* ✅ success/error feedback */}
      {loading && <p className="text-blue-500">Saving employee...</p>}
      {error && (
        <p className="text-red-500">
          {typeof error === "string"
            ? error
            : JSON.stringify(error, null, 2)}
        </p>
      )}
      {success && response?.message && (
        <p className="text-green-600">{response.message}</p>
      )}

      {/* Header Section */}
      <div className="flex justify-between flex-col md:flex-row ">
        <div className="flex items-center space-x-4 mb-6 flex-col md:flex-row">
          <img
            src={profile?.avatar || userProfile}
            alt="User Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="">
            <h3 className="text-lg font-medium capitalize">
              {profile?.name || "N/A"}
            </h3>
            <p className="text-xs bg-green-100 text-green-900 rounded-full px-3 py-1 inline-block">
              {profile?.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="p-3 border-l-2 flex gap-6">
            <div>
              <p className="text-sm font-semibold">Role</p>
              <span className="text-xs ">{profile?.role?.name}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Email</p>
              <span className="text-xs ">{profile?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-1 py-1 border bg-white rounded-md">
            <EllipsisVertical />
          </button>
          <button className="px-3 py-1 text-sm flex items-center gap-2 bg-purple-800 rounded-md text-white">
            <MailPlus className="w-5" /> Send Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          "Profile",
          "Attendance",
          "Tasks",
          "Messages",
          "Files",
          "Settings",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${
              activeTab === tab
                ? "border-purple-600 text-purple-600 font-semibold"
                : "border-transparent text-gray-800 hover:text-purple-600"
            }`}
          >
            {tab === "Profile" && <User className="w-4 mr-1" />}
            {tab === "Attendance" && <CalendarCheck className="w-4 mr-1" />}
            {tab === "Tasks" && <ClipboardList className="w-4 mr-1" />}
            {tab === "Messages" && <MessageCircleMore className="w-4 mr-1" />}
            {tab === "Files" && <FolderClosed className="w-4 mr-1" />}
            {tab === "Settings" && <Settings className="w-4 mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          {/* Left (Main Info) */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Personal Information */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs text-gray-800">Gender</p>
                  <Select
                    value={formData.gender || undefined}
                    onChange={(val) => handleChange("gender", val)}
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select Gender"
                  >
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-gray-800">Marital Status</p>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.maritalStatus || undefined}
                    onChange={(val) => handleChange("maritalStatus", val)}
                    placeholder="Select Marital Status"
                  >
                    {martialStatuses.map((status) => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-gray-800">Religion</p>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.religion || undefined}
                    onChange={(val) => handleChange("religion", val)}
                    placeholder="Select Religion"
                  >
                    {religions.map((r) => (
                      <Option key={r} value={r}>
                        {r}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-gray-800">Birth Date</p>
                  <DatePicker
                    className="w-full"
                    value={
                      formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null
                    }
                    onChange={(_, dateStr) =>
                      handleChange("dateOfBirth", dateStr)
                    }
                    format="YYYY-MM-DD"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-800">Blood Type</p>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.bloodType || undefined}
                    onChange={(val) => handleChange("bloodType", val)}
                    placeholder="Select Blood Type"
                  >
                    {bloodGroups.map((bg) => (
                      <Option key={bg} value={bg}>
                        {bg}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-gray-800">Aadhar No</p>
                  <Input
                    value={formData.idProof}
                    onChange={(e) => handleChange("idProof", e.target.value)}
                    placeholder="Enter Aadher no"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-800">Qualification</p>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.qualification}
                    onChange={(vals) => handleChange("qualification", vals)}
                    placeholder="Select qualification"
                  >
                    {qualifications.map((q) => (
                      <Option key={q.id} value={q.id}>
                        {q.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <p className="text-xs text-gray-800">Experience</p>
                  <Input
                    value={formData.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    placeholder="Enter Experience"
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-800">Subjects</p>
                 <Select
  mode="multiple"
  allowClear
  style={{ width: "100%" }}
  value={formData.subjects}
  onChange={(vals) => handleChange("subjects", vals)}
  placeholder="Select Subjects"
>
  {subjectList.map((s) => (
    <Option key={s._id} value={s._id}>
      {s.name}
    </Option>
  ))}
</Select>
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Bank Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-800">Account Holder</p>
                  <Input
                    placeholder="Account Holder"
                    value={formData.accountHolder}
                    onChange={(e) =>
                      handleChange("accountHolder", e.target.value)
                    }
                  />
                </div>

                <div>
                  <p className="text-xs text-gray-800">Account Number</p>
                  <Input
                    placeholder="Account Number"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleChange("accountNumber", e.target.value)
                    }
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">IFSC Code</p>
                  <Input
                    placeholder="IFSC Code"
                    className="uppercase"
                    value={formData.ifscCode}
                    onChange={(e) => handleChange("ifscCode", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">Bank Name</p>
                  <Input
                    placeholder="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => handleChange("bankName", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">Branch</p>
                  <Input
                    placeholder="Branch"
                    value={formData.branch}
                    onChange={(e) => handleChange("branch", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">PAN Number</p>
                  <Input
                    placeholder="PAN Number"
                    className="uppercase"
                    value={formData.panNumber}
                    onChange={(e) => handleChange("panNumber", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">PF Number</p>
                  <Input
                    placeholder="PF Number"
                    value={formData.pfNumber}
                    onChange={(e) => handleChange("pfNumber", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">ESI Number</p>
                  <Input
                    placeholder="ESI Number"
                    value={formData.esiNumber}
                    onChange={(e) => handleChange("esiNumber", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Address Information</h3>
              <div className="grid grid-cols-4 gap-5">
                <div>
                  <p className="text-xs text-gray-800">Street</p>
                  <Input
                    placeholder="Street"
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800">City</p>
                  <Select
                    value={formData.city || undefined}
                    onChange={(val) => handleChange("city", val)}
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Selcet Street"
                  >
                    {cities.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-800">State</p>
                  <Select
                    value={formData.state || undefined}
                    onChange={(val) => handleChange("state", val)}
                    allowClear
                    style={{ width: "100%" }}
                  >
                    {states.map((s) => (
                      <Option key={s} value={s}>
                        {s}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-800">Zip Code</p>
                  <Input
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={(e) => handleChange("zipCode", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-800 ">Citizen Address</p>
                <Input
                  placeholder="Citizen Address"
                  value={formData.CitizenAddress} // ✅ match backend
                  onChange={(e) =>
                    handleChange("CitizenAddress", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Side (Overview + Contact) */}
          <div className="flex flex-col gap-3">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Contact Information</h3>
              <p className="text-xs text-gray-800 ">Mobile No</p>
              <Input
                placeholder="Phone Number"
                maxLength={10}
                value={formData.phoneNo}
                onChange={(e) => handleChange("phoneNo", e.target.value)}
              />
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-800 ">Joining Date</p>
                  <DatePicker
                    className="w-full mb-3"
                    value={formData.joinDate ? dayjs(formData.joinDate) : null}
                    onChange={(_, dateStr) => handleChange("joinDate", dateStr)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Department</p>
                  <Input
                    placeholder="Department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    className="mb-3"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Designation</p>
                  <Input
                    placeholder="Designation"
                    value={formData.designation}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    className="mb-3"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Employee Status</p>
                  <Select
                    value={formData.employeeStatus || undefined}
                    onChange={(val) => handleChange("employeeStatus", val)}
                    allowClear
                    style={{ width: "100%" }}
                  >
                    <Option value="Full-Time">Full-Time</Option>
                    <Option value="Part-Time">Part-Time</Option>
                    <Option value="Contract">Contract</Option>
                  </Select>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-800 ">Notes</p>
                  <textarea
                    className="w-full border  rounded-lg px-2 py-1 text-xs"
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button type="primary" onClick={handleSubmit}>
              Save Employee
            </Button>
          </div>
        </div>
      )}

      {activeTab === "Attendance" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          <AttendanceCalendar />
        </div>
      )}
      {activeTab === "Tasks" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Tasks Options coming soon...
        </div>
      )}
      {activeTab === "Messages" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Messages Options coming soon...
        </div>
      )}
      {activeTab === "Files" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Files Options coming soon...
        </div>
      )}
      {activeTab === "Settings" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Settings Options coming soon...
        </div>
      )}
    </div>
  );
};

export default EmployeeForm;

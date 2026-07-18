import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import {
  Tabs, Form, Input, Select, DatePicker, Button, Spin, message,
} from "antd";
import {
  UserOutlined, CalendarOutlined, BankOutlined, TeamOutlined,
  IdcardOutlined, PhoneOutlined, BookOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useDispatch, useSelector } from "react-redux";
import { createEmployee, updateEmployee } from "../../features/employeeSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { getAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { updateEmployeeStatutory } from "../../features/payrollSlice";

const AttendanceCalendar = lazy(() => import("../../pages/AttendanceCalendar"));

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  success: "#22C55E", border: "#E2E8F0",
  text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const qualifications = [
  "High School / 10th", "Intermediate / 12th", "Diploma",
  "Bachelor's Degree", "Master's Degree", "PhD / Doctorate",
  "ITI / Trade Course", "Professional Certification", "Other",
];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"];
const employeeStatuses = ["Full-Time", "Part-Time", "Contract"];

const SectionHeader = ({ icon, title }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    paddingBottom: 10, borderBottom: "1.5px solid " + C.border,
    marginBottom: 14, marginTop: 20,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: C.primaryLighter, color: C.primary,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
    }}>
      {icon}
    </div>
    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{title}</span>
  </div>
);

const fi = { marginBottom: 12 };

const EmployeeForm = ({ editingEmployee = null, onSuccess }) => {
  const [form] = Form.useForm();
  const [statutoryForm] = Form.useForm();
  const [savingStatutory, setSavingStatutory] = useState(false);
  const dispatch = useDispatch();

  const selectedUserId = Form.useWatch("userId", form);
  const { profile, user, users = [] } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);
  const { subjects = [] } = useSelector((s) => s.subject);
  const { loading } = useSelector((s) => s.employee);

  const schoolId = profile?.school?._id || user?.school?._id;
  const academicYearId = activeYear?._id;

  // Determine if selected/editing employee is a Teacher
  const isTeacherRole = useMemo(() => {
    const getRole = (userObj) =>
      userObj?.role?.name || userObj?.roleId?.name || "";

    if (editingEmployee) {
      const userObj = editingEmployee.userId;
      const roleName =
        typeof userObj === "object"
          ? getRole(userObj).toLowerCase()
          : (users.find((u) => u._id === userObj)?.role?.name || "").toLowerCase();
      if (roleName?.includes("teacher")) return true;
    }
    if (selectedUserId) {
      const u = users.find((u) => u._id === selectedUserId);
      return getRole(u).toLowerCase().includes("teacher");
    }
    return false;
  }, [editingEmployee, selectedUserId, users]);

  // UserId for attendance tab
  const effectiveUserId =
    selectedUserId ||
    (typeof editingEmployee?.userId === "object"
      ? editingEmployee?.userId?._id
      : editingEmployee?.userId);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchActiveAcademicYear(schoolId));
      dispatch(fetchAllUser({ schoolId, isActive: true }));
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(getAllSubjects({ page: 1, limit: 100, schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  // Pre-fill when editing
  useEffect(() => {
    if (editingEmployee) {
      const userObj = editingEmployee.userId;
      const userId = typeof userObj === "object" ? userObj?._id : userObj;
      form.setFieldsValue({
        userId,
        gender: editingEmployee.gender,
        maritalStatus: editingEmployee.maritalStatus,
        religion: editingEmployee.religion,
        dateOfBirth: editingEmployee.dateOfBirth ? dayjs(editingEmployee.dateOfBirth) : null,
        bloodType: editingEmployee.bloodType,
        idProof: editingEmployee.idProof,
        phoneNo: editingEmployee.phoneNo,
        citizenAddress: editingEmployee.citizenAddress,
        qualification: editingEmployee.qualification,
        experience: editingEmployee.experience,
        subjects: editingEmployee.subjects?.map((s) => (typeof s === "object" ? s._id : s)) || [],
        joinDate: editingEmployee.joinDate ? dayjs(editingEmployee.joinDate) : null,
        department: editingEmployee.department,
        designation: editingEmployee.designation,
        employeeStatus: editingEmployee.employeeStatus,
        accountHolder: editingEmployee.accountHolder,
        accountNumber: editingEmployee.accountNumber,
        ifscCode: editingEmployee.ifscCode,
        bankName: editingEmployee.bankName,
        branch: editingEmployee.branch,
        panNumber: editingEmployee.panNumber,
        pfNumber: editingEmployee.pfNumber,
        esiNumber: editingEmployee.esiNumber,
      });
    } else {
      form.resetFields();
    }
  }, [editingEmployee, form]);

  // Pre-fill the PF/ESI statutory tab when editing
  useEffect(() => {
    const statutory = editingEmployee?.statutoryCompliance;
    if (statutory) {
      statutoryForm.setFieldsValue({
        uan: statutory.uan,
        pfJoiningDate: statutory.pfJoiningDate ? dayjs(statutory.pfJoiningDate) : null,
        pfExitDate: statutory.pfExitDate ? dayjs(statutory.pfExitDate) : null,
        pfCategory: statutory.pfCategory,
        esicNumber: statutory.esicNumber,
        esiJoiningDate: statutory.esiJoiningDate ? dayjs(statutory.esiJoiningDate) : null,
        esiCategory: statutory.esiCategory,
      });
    } else {
      statutoryForm.resetFields();
    }
  }, [editingEmployee, statutoryForm]);

  const handleStatutorySubmit = async (values) => {
    if (!editingEmployee?._id) return;
    setSavingStatutory(true);
    try {
      const payload = {
        ...values,
        pfJoiningDate: values.pfJoiningDate ? values.pfJoiningDate.toISOString() : null,
        pfExitDate: values.pfExitDate ? values.pfExitDate.toISOString() : null,
        esiJoiningDate: values.esiJoiningDate ? values.esiJoiningDate.toISOString() : null,
      };
      await dispatch(updateEmployeeStatutory({ employeeId: editingEmployee._id, payload })).unwrap();
      message.success("PF/ESI details updated");
    } catch (e) {
      message.error(e?.message || "PF/ESI details save failed");
    } finally {
      setSavingStatutory(false);
    }
  };

  const userOptions = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return list
      .filter((u) => {
        const roleName = (u?.role?.name || u?.roleId?.name || "").toLowerCase();
        return u?.isActive && !["student", "parent", "super admin"].includes(roleName);
      })
      .map((u) => {
        const roleName = u?.role?.name || u?.roleId?.name || "No Role";
        return { value: u._id, label: `${u?.name || "User"} (${roleName})` };
      });
  }, [users]);

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      schoolId,
      academicYearId,
      dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).format("YYYY-MM-DD") : null,
      joinDate: values.joinDate ? dayjs(values.joinDate).format("YYYY-MM-DD") : null,
    };

    if (editingEmployee?._id) {
      const res = await dispatch(updateEmployee({ id: editingEmployee._id, payload }));
      if (updateEmployee.fulfilled.match(res)) {
        message.success("Employee updated successfully");
        onSuccess?.();
      } else {
        message.error(res?.payload?.message || "Failed to update employee");
      }
    } else {
      const res = await dispatch(createEmployee(payload));
      if (createEmployee.fulfilled.match(res) && res.payload?.success) {
        message.success(res.payload?.message || "Employee created successfully");
        form.resetFields();
        onSuccess?.();
      } else {
        message.error(res?.payload?.message || "Failed to create employee");
      }
    }
  };

  const profileTab = (
    <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ paddingBottom: 8 }}>
      {/* ── Personal Info ── */}
      <SectionHeader icon={<UserOutlined />} title="Personal Information" />

      <Form.Item
        name="userId"
        label="Select User"
        rules={[{ required: true, message: "Please select a user" }]}
        style={fi}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Search user by name or role…"
          options={userOptions}
          disabled={!!editingEmployee}
          size="large"
        />
      </Form.Item>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
        <Form.Item name="gender" label="Gender" rules={[{ required: true }]} style={fi}>
          <Select options={[{ value: "Male" }, { value: "Female" }, { value: "Other" }]} placeholder="Select" />
        </Form.Item>
        <Form.Item name="maritalStatus" label="Marital Status" rules={[{ required: true }]} style={fi}>
          <Select options={maritalStatuses.map((m) => ({ value: m }))} placeholder="Select" />
        </Form.Item>
        <Form.Item name="religion" label="Religion" rules={[{ required: true }]} style={fi}>
          <Select options={religions.map((r) => ({ value: r }))} placeholder="Select" />
        </Form.Item>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
        <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]} style={fi}>
          <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" placeholder="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item name="bloodType" label="Blood Group" rules={[{ required: true }]} style={fi}>
          <Select options={bloodGroups.map((b) => ({ value: b }))} placeholder="Select" />
        </Form.Item>
        <Form.Item name="idProof" label="Aadhar Number" rules={[{ required: true }]} style={fi}>
          <Input
            placeholder="XXXX XXXX XXXX"
            prefix={<IdcardOutlined style={{ color: C.textMuted, fontSize: 12 }} />}
          />
        </Form.Item>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0 12px" }}>
        <Form.Item
          name="phoneNo"
          label="Phone Number"
          rules={[
            { required: true },
            { pattern: /^\+?[0-9]{10,13}$/, message: "Valid 10-13 digit number" },
          ]}
          style={fi}
        >
          <Input
            placeholder="+91 9999999999"
            prefix={<PhoneOutlined style={{ color: C.textMuted, fontSize: 12 }} />}
          />
        </Form.Item>
        <Form.Item name="citizenAddress" label="Address" rules={[{ required: true }]} style={fi}>
          <Input.TextArea rows={2} placeholder="Full residential address…" />
        </Form.Item>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0 12px" }}>
        <Form.Item name="qualification" label="Qualification" rules={[{ required: true }]} style={fi}>
          <Select mode="multiple" options={qualifications.map((q) => ({ value: q }))} placeholder="Select qualifications" />
        </Form.Item>
        <Form.Item name="experience" label="Experience (years)" rules={[{ required: true }]} style={fi}>
          <Input type="number" min={0} placeholder="e.g. 5" suffix="yrs" />
        </Form.Item>
      </div>

      {isTeacherRole && (
        <Form.Item
          name="subjects"
          label={
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BookOutlined style={{ color: C.accent }} />
              Subjects Taught
            </span>
          }
          rules={[{ required: true, message: "Please select at least one subject" }]}
          style={fi}
        >
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            placeholder="Search and select subjects…"
            options={subjects.map((s) => ({ label: s.name, value: s._id }))}
          />
        </Form.Item>
      )}

      {/* ── Employment Overview ── */}
      <SectionHeader icon={<TeamOutlined />} title="Employment Overview" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0 12px" }}>
        <Form.Item name="joinDate" label="Joining Date" rules={[{ required: true }]} style={fi}>
          <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item name="department" label="Department" rules={[{ required: true }]} style={fi}>
          <Input placeholder="e.g. Science" />
        </Form.Item>
        <Form.Item name="designation" label="Designation" rules={[{ required: true }]} style={fi}>
          <Input placeholder="e.g. Senior Teacher" />
        </Form.Item>
        <Form.Item name="employeeStatus" label="Employment Status" rules={[{ required: true }]} style={fi}>
          <Select options={employeeStatuses.map((s) => ({ value: s }))} placeholder="Select" />
        </Form.Item>
      </div>

      {/* ── Bank Details ── */}
      <SectionHeader icon={<BankOutlined />} title="Bank Details" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Form.Item name="accountHolder" label="Account Holder Name" style={fi}>
          <Input placeholder="Full name as per bank" />
        </Form.Item>
        <Form.Item name="accountNumber" label="Account Number" style={fi}>
          <Input placeholder="XXXXXXXXXXXXXXXX" />
        </Form.Item>
        <Form.Item name="ifscCode" label="IFSC Code" style={fi}>
          <Input placeholder="e.g. SBIN0001234" />
        </Form.Item>
        <Form.Item name="bankName" label="Bank Name" style={fi}>
          <Input placeholder="e.g. State Bank of India" />
        </Form.Item>
        <Form.Item name="branch" label="Branch" style={fi}>
          <Input placeholder="Branch name / city" />
        </Form.Item>
        <Form.Item name="panNumber" label="PAN Number" style={fi}>
          <Input placeholder="AAAAA0000A" />
        </Form.Item>
        <Form.Item name="pfNumber" label="PF Number" style={fi}>
          <Input placeholder="PF account number" />
        </Form.Item>
        <Form.Item name="esiNumber" label="ESI Number" style={fi}>
          <Input placeholder="ESI account number" />
        </Form.Item>
      </div>

      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 10,
        marginTop: 8, paddingTop: 14, borderTop: "1px solid " + C.border,
      }}>
        <Button
          htmlType="submit"
          loading={loading}
          style={{
            background: C.primary, borderColor: C.primary,
            color: "#fff", borderRadius: 9, fontWeight: 700,
            padding: "0 32px", height: 40,
          }}
        >
          {editingEmployee ? "Update Employee" : "Create Employee"}
        </Button>
      </div>
    </Form>
  );

  const attendanceTab = (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>}>
      {effectiveUserId ? (
        <AttendanceCalendar userId={effectiveUserId} schoolId={schoolId} />
      ) : (
        <div style={{
          textAlign: "center", padding: "56px 24px",
          background: C.surfaceSoft, borderRadius: 12,
          border: "1.5px dashed " + C.border,
        }}>
          <CalendarOutlined style={{ fontSize: 36, color: C.textMuted, marginBottom: 10 }} />
          <div style={{ fontWeight: 600, fontSize: 14, color: C.textSub }}>No Employee Selected</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
            Select a user in the Profile tab first
          </div>
        </div>
      )}
    </Suspense>
  );

  const statutoryTab = editingEmployee?._id ? (
    <Form form={statutoryForm} layout="vertical" onFinish={handleStatutorySubmit} style={{ paddingBottom: 8 }}>
      <SectionHeader icon={<SafetyCertificateOutlined />} title="EPF (Provident Fund)" />
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
        Identity/reference details only — whether PF/ESI actually applies to this employee is
        the "PF Enabled" / "ESI Enabled" toggle on their salary structure.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Form.Item
          name="uan"
          label="UAN (Universal Account Number)"
          rules={[{ pattern: /^\d{12}$/, message: "UAN must be exactly 12 digits" }]}
          style={fi}
        >
          <Input placeholder="12-digit UAN" maxLength={12} />
        </Form.Item>
        <Form.Item name="pfJoiningDate" label="PF Joining Date" style={fi}>
          <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item name="pfExitDate" label="PF Exit Date" style={fi}>
          <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item name="pfCategory" label="PF Category" style={fi}>
          <Select
            options={[
              { value: "general", label: "General" },
              { value: "international_worker", label: "International Worker" },
              { value: "excluded", label: "Excluded Employee" },
            ]}
          />
        </Form.Item>
      </div>

      <SectionHeader icon={<SafetyCertificateOutlined />} title="ESI (State Insurance)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        <Form.Item
          name="esicNumber"
          label="ESIC Number"
          rules={[{ pattern: /^\d{10,17}$/, message: "ESIC number must be 10-17 digits" }]}
          style={fi}
        >
          <Input placeholder="ESIC insurance number" />
        </Form.Item>
        <Form.Item name="esiJoiningDate" label="ESI Joining Date" style={fi}>
          <DatePicker style={{ width: "100%" }} format="DD-MM-YYYY" />
        </Form.Item>
        <Form.Item name="esiCategory" label="ESI Category" style={fi}>
          <Select
            options={[
              { value: "general", label: "General" },
              { value: "disability", label: "Person with Disability" },
              { value: "excluded", label: "Excluded Employee" },
            ]}
          />
        </Form.Item>
      </div>

      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 10,
        marginTop: 8, paddingTop: 14, borderTop: "1px solid " + C.border,
      }}>
        <Button
          htmlType="submit"
          loading={savingStatutory}
          style={{
            background: C.primary, borderColor: C.primary,
            color: "#fff", borderRadius: 9, fontWeight: 700,
            padding: "0 32px", height: 40,
          }}
        >
          Save PF/ESI Details
        </Button>
      </div>
    </Form>
  ) : (
    <div style={{
      textAlign: "center", padding: "56px 24px",
      background: C.surfaceSoft, borderRadius: 12,
      border: "1.5px dashed " + C.border,
    }}>
      <SafetyCertificateOutlined style={{ fontSize: 36, color: C.textMuted, marginBottom: 10 }} />
      <div style={{ fontWeight: 600, fontSize: 14, color: C.textSub }}>Save the Profile Tab First</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
        PF/ESI details can be added once the employee record exists
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: "profile",
            label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><UserOutlined /> Profile</span>,
            children: profileTab,
          },
          {
            key: "statutory",
            label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><SafetyCertificateOutlined /> PF/ESI</span>,
            children: statutoryTab,
          },
          {
            key: "attendance",
            label: <span style={{ display: "flex", alignItems: "center", gap: 6 }}><CalendarOutlined /> Attendance</span>,
            children: attendanceTab,
          },
        ]}
      />
    </div>
  );
};

export default EmployeeForm;

import React, { useEffect, useMemo, lazy, Suspense } from "react";
import {
  Tabs,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  message,
  Spin,
} from "antd";
import {
  User,
  CalendarCheck,
  ClipboardList,
  MessageCircleMore,
  FolderClosed,
  Settings,
} from "lucide-react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

import { useDispatch, useSelector } from "react-redux";
import { createEmployee } from "../../features/employeeSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { getAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { useSearchParams } from "react-router-dom";

// 🔥 Lazy Load
const AttendanceCalendar = lazy(() =>
  import("../../pages/AttendanceCalendar")
);

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { TabPane } = Tabs;

const qualifications = [
  "High School / 10th",
  "Intermediate / 12th",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "ITI / Trade Course",
  "Professional Certification",
  "Other",
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed", "Separated"];
const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"];

const EmployeeForm = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { profile, users = [] } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  const { subjectList = [] } = useSelector((state) => state.subject);
  const { loading } = useSelector((state) => state.employee);

  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [schoolId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(getAllSubjects({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllUser({ schoolId, isActive: true }));
    }
  }, [schoolId, dispatch]);

  useEffect(() => {
    const userIdFromQuery = searchParams.get("id");
    if (userIdFromQuery) {
      form.setFieldValue("userId", userIdFromQuery);
    }
  }, [form, searchParams]);

  const userOptions = useMemo(() => {
    const userList = Array.isArray(users) ? users : [];

    return userList
      .filter((user) => user?.isActive)
      .filter((user) => user?.role?.name?.toLowerCase() !== "student")
      .map((user) => ({
        value: user._id,
        label: `${user?.name || "User"} (${user?.role?.name || "No Role"})`,
      }));
  }, [users]);

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      schoolId,
      academicYearId,
      dateOfBirth: values.dateOfBirth
        ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
        : null,
      joinDate: values.joinDate
        ? dayjs(values.joinDate).format("YYYY-MM-DD")
        : null,
    };

    const res = await dispatch(createEmployee(payload));

    if (res?.payload?.success) {
      message.success("Employee created successfully");
      form.resetFields();
    } else {
      message.error("Failed to create employee");
    }
  };

  return (
    <Card className="min-h-screen">
      <Tabs defaultActiveKey="profile">
        {/* ================= PROFILE ================= */}
        <TabPane
          key="profile"
          tab={
            <span className="flex items-center gap-1">
              <User size={16} /> Profile
            </span>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* PERSONAL INFO */}
            <Card title="Personal Information" className="mb-4">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="userId"
                    label="Select User (Student excluded)"
                    rules={[{ required: true, message: "Please select a user" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select existing user"
                      options={userOptions}
                    />
                  </Form.Item>
                </Col>
                <Col md={8}>
                  <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                    <Select options={[{ value: "Male" }, { value: "Female" }]} />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="maritalStatus" label="Marital Status" rules={[{ required: true }]}>
                    <Select options={maritalStatuses.map(m => ({ value: m }))} />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="religion" label="Religion" rules={[{ required: true }]}>
                    <Select options={religions.map(r => ({ value: r }))} />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}>
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="bloodType" label="Blood Group" rules={[{ required: true }]}>
                    <Select options={bloodGroups.map(b => ({ value: b }))} />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="idProof" label="Aadhar Number" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>

                <Col md={12}>
                  <Form.Item name="qualification" label="Qualification" rules={[{ required: true }]}>
                    <Select mode="multiple" options={qualifications.map(q => ({ value: q }))} />
                  </Form.Item>
                </Col>

                <Col md={12}>
                  <Form.Item name="experience" label="Experience" rules={[{ required: true }]}>
                    <Input placeholder="e.g. 5 Years" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="subjects" label="Subjects" rules={[{ required: true }]}>
                    <Select
                      mode="multiple"
                      options={subjectList.map(s => ({
                        label: s.name,
                        value: s._id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* JOINING */}
            <Card title="Employment Overview">
              <Row gutter={16}>
                <Col md={8}>
                  <Form.Item name="joinDate" label="Joining Date" rules={[{ required: true }]}>
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>

                <Col md={8}>
                  <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <div className="flex justify-end mt-4">
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Employee
              </Button>
            </div>
          </Form>
        </TabPane>

        {/* ================= ATTENDANCE ================= */}
        <TabPane
          key="attendance"
          tab={
            <span className="flex items-center gap-1">
              <CalendarCheck size={16} /> Attendance
            </span>
          }
        >
          {/* 🔥 Lazy Loaded Component */}
          <Suspense fallback={<Spin />}>
            <AttendanceCalendar />
          </Suspense>
        </TabPane>

        <TabPane key="tasks" tab={<ClipboardList size={16} />}>Coming soon</TabPane>
        <TabPane key="messages" tab={<MessageCircleMore size={16} />}>Coming soon</TabPane>
        <TabPane key="files" tab={<FolderClosed size={16} />}>Coming soon</TabPane>
        <TabPane key="settings" tab={<Settings size={16} />}>Coming soon</TabPane>
      </Tabs>
    </Card>
  );
};

export default EmployeeForm;

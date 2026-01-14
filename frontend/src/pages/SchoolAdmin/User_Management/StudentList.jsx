import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Card, Input, Button, Modal, Space, Avatar, Select } from "antd";
import { User, Download } from "lucide-react";

import {
  fetchAllStudent,
  fetchStudentsBySchoolId,
} from "../../../features/studentSlice";
import AdmissionForm from "../../../components/forms/AdmissionForm";
import { activeUser } from "../../../features/authSlice";

const { Option } = Select;

const StudentList = () => {
  const dispatch = useDispatch();
  const { studentList = [], schoolStudents = [] } = useSelector(
    (state) => state.students
  );
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  // Fetch user if not loaded
  useEffect(() => {
    if (!user) dispatch(activeUser());
  }, [dispatch, user]);

  // Fetch students based on role
  useEffect(() => {
    if (!user) return;

    if (user.role?.name === "Super Admin") {
      dispatch(fetchAllStudent());
    } else if (user.role?.name === "School Admin" && schoolId) {
      dispatch(
        fetchStudentsBySchoolId({
          schoolId,
          academicYearId,
        })
      );
    }
  }, [dispatch, user, schoolId, academicYearId, isModalOpen]);

  const studentsData =
    user?.role?.name === "Super Admin" ? studentList : schoolStudents;

  // Format data for table
  const formattedStudents = Array.isArray(studentsData)
    ? studentsData.map((stu) => ({
        key: stu._id,
        name: stu.userDetails?.name ?? "N/A",
        email: stu.userDetails?.email ?? "N/A",
        class: stu.class?.name ?? "N/A",
        section: stu.section?.name ?? "N/A",
        dateOfBirth: stu.student?.dateOfBirth
          ? new Date(stu.student.dateOfBirth).toISOString().split("T")[0]
          : "N/A",
        mobileNumber: stu.mobileNumber ?? "N/A",
        admissionDate: stu.admissionDate
          ? new Date(stu.admissionDate).toISOString().split("T")[0]
          : "N/A",
        bloodGroup: stu.student?.bloodGroup ?? "N/A",
        schoolName: stu.school?.name ?? "N/A",
        academicYear: stu.academicYear?.name ?? "N/A",
        status: stu.status ?? "N/A",
      }))
    : [];

  // Generate class and section options dynamically
  const classOptions = [
    "all",
    ...new Set(formattedStudents.map((s) => s.class).filter(Boolean)),
  ];

  const sectionOptions = [
    "all",
    ...new Set(
      formattedStudents
        .filter((s) => selectedClass === "all" || s.class === selectedClass)
        .map((s) => s.section)
        .filter(Boolean)
    ),
  ];

  // Combined filter: search + class + section
  const filteredStudents = formattedStudents.filter((stu) => {
    const matchSearch = searchText
      ? stu.name.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchClass = selectedClass === "all" || stu.class === selectedClass;
    const matchSection = selectedSection === "all" || stu.section === selectedSection;
    return matchSearch && matchClass && matchSection;
  });

  // Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => (
        <Space>
          <Avatar
            src={`https://ui-avatars.com/api/?name=${text}&background=random`}
            size="small"
          />
          <span>{text}</span>
        </Space>
      ),
    },
    { title: "Class", dataIndex: "class", key: "class" },
    { title: "Section", dataIndex: "section", key: "section" },
    { title: "Date of Birth", dataIndex: "dateOfBirth", key: "dateOfBirth" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone Number", dataIndex: "mobileNumber", key: "mobileNumber" },
    { title: "Admission Date", dataIndex: "admissionDate", key: "admissionDate" },
    { title: "Blood Group", dataIndex: "bloodGroup", key: "bloodGroup" },
    { title: "School", dataIndex: "schoolName", key: "schoolName" },
    { title: "Academic Year", dataIndex: "academicYear", key: "academicYear" },
  ];

  return (
    <Card
      title="Students Details"
      extra={
        <Space wrap>
          <Input.Search
            placeholder="Search Student"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />

          <Select
            value={selectedClass}
            onChange={(value) => {
              setSelectedClass(value);
              setSelectedSection("all"); // reset section on class change
            }}
            style={{ width: 160 }}
          >
            {classOptions.map((cls) => (
              <Option key={cls} value={cls}>
                {cls === "all" ? "All Classes" : cls}
              </Option>
            ))}
          </Select>

          <Select
            value={selectedSection}
            onChange={setSelectedSection}
            style={{ width: 160 }}
            disabled={selectedClass === "all"}
          >
            {sectionOptions.map((sec) => (
              <Option key={sec} value={sec}>
                {sec === "all" ? "All Sections" : sec}
              </Option>
            ))}
          </Select>

          <Button icon={<Download size={16} />}>Export</Button>

          <Button
            type="primary"
            icon={<User size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Student Admission
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredStudents}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      {/* Add Student Modal */}
      <Modal
        title="Student Admission Form"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <AdmissionForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </Card>
  );
};

export default StudentList;

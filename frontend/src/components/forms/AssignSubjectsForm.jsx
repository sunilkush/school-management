import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Form,
  Select,
  Table,
  Checkbox,
  InputNumber,
  Button,
  Spin,
  Typography,
  message,
  Space,
} from "antd";
import {
  fetchSchools,
} from "../../features/schoolSlice";
import {
  fetchClasses,
} from "../../features/classSlice";
import {
  fetchAllSubjects,
} from "../../features/subjectSlice";
import {
  fetchAllUser,
} from "../../features/authSlice";
import axios from "axios";

const { Title, Text } = Typography;

const AssignSubjectsForm = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // 🔹 Redux state
  const { schools = [] } = useSelector((s) => s.school);
  const { classes = [] } = useSelector((s) => s.class);
  const { subjects = [] } = useSelector((s) => s.subject);
  const { users = [] } = useSelector((s) => s.auth);

  // 🔹 Local state
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Initial fetch (Super Admin)
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // 🔹 Fetch dependent data
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchClasses({ schoolId: selectedSchool }));
      dispatch(fetchAllSubjects({ schoolId: selectedSchool }));
      dispatch(fetchAllUser({ role: "teacher", schoolId: selectedSchool }));
    }
  }, [selectedSchool, dispatch]);

  // 🔹 Handle assignment change
  const updateAssignment = (subjectId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || {}),
        [field]: value,
      },
    }));
  };

  // 🔹 Submit handler
  const handleSubmit = async () => {
    if (!selectedClass) {
      message.warning("Please select a class");
      return;
    }

    const payload = Object.entries(assignments).map(
      ([subjectId, values]) => ({
        subjectId,
        teacherId: values.teacherId,
        periodPerWeek: values.periodPerWeek || 0,
        isCompulsory: values.isCompulsory ?? true,
      })
    );

    setLoading(true);
    try {
      await axios.post("/api/class/assign-subjects", {
        classId: selectedClass,
        assignments: payload,
      });
      message.success("Subjects assigned successfully");
      setAssignments({});
    } catch (error) {
      message.error(error, "Failed to assign subjects");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Table columns
  const columns = [
    {
      title: "Subject",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Teacher",
      dataIndex: "_id",
      key: "teacher",
      render: (subjectId) => (
        <Select
          placeholder="Select Teacher"
          className="w-full"
          allowClear
          value={assignments[subjectId]?.teacherId}
          onChange={(val) =>
            updateAssignment(subjectId, "teacherId", val)
          }
        >
          {users
            .filter((u) => u.role?.toLowerCase() === "teacher")
            .map((t) => (
              <Select.Option key={t._id} value={t._id}>
                {t.name}
              </Select.Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Periods / Week",
      dataIndex: "_id",
      key: "period",
      align: "center",
      render: (subjectId) => (
        <InputNumber
          min={0}
          value={assignments[subjectId]?.periodPerWeek || 0}
          onChange={(val) =>
            updateAssignment(subjectId, "periodPerWeek", val)
          }
        />
      ),
    },
    {
      title: "Compulsory",
      dataIndex: "_id",
      key: "compulsory",
      align: "center",
      render: (subjectId) => (
        <Checkbox
          checked={assignments[subjectId]?.isCompulsory ?? true}
          onChange={(e) =>
            updateAssignment(
              subjectId,
              "isCompulsory",
              e.target.checked
            )
          }
        />
      ),
    },
  ];

  return (
    <Card className="rounded-2xl shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <Title level={4} className="!mb-1">
          Assign Subjects to Class
        </Title>
        <Text type="secondary">
          Select school and class, then configure subject assignments
        </Text>
      </div>

      {/* Selection */}
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Form.Item label="School" required>
            <Select
              showSearch
              placeholder="Select School"
              value={selectedSchool}
              onChange={(val) => {
                setSelectedSchool(val);
                setSelectedClass(null);
                setAssignments({});
              }}
            >
              {schools.map((s) => (
                <Select.Option key={s._id} value={s._id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Class" required>
            <Select
              showSearch
              placeholder="Select Class"
              value={selectedClass}
              disabled={!selectedSchool}
              onChange={setSelectedClass}
            >
              {classes.map((c) => (
                <Select.Option key={c._id} value={c._id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>

      {/* Table */}
      {selectedClass && (
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={subjects}
            pagination={false}
            bordered
            size="middle"
            className="rounded-lg overflow-hidden"
          />

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleSubmit}
            >
              Save Assignments
            </Button>
          </div>
        </Spin>
      )}
    </Card>
  );
};

export default AssignSubjectsForm;

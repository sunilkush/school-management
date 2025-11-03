import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Table, Checkbox, InputNumber, Button, Spin, message } from "antd";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchClasses } from "../../features/classSlice";
import { fetchAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import axios from "axios";

const { Option } = Select;

const AssignSubjectsForm = () => {
  const dispatch = useDispatch();

  // ✅ Redux states
  const { schools } = useSelector((state) => state.school);
  const { classes } = useSelector((state) => state.class);
  const { subjects } = useSelector((state) => state.subject);
  const { users } = useSelector((state) => state.auth);

  // ✅ Local state
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(false);

  // 🧩 Fetch all schools initially (Super Admin)
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // 🧩 When school changes, fetch class, subjects, teachers
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchClasses({ schoolId: selectedSchool }));
      dispatch(fetchAllSubjects({ schoolId: selectedSchool }));
      dispatch(fetchAllUser({ role: "teacher", schoolId: selectedSchool }));
    }
  }, [selectedSchool, dispatch]);

  // 🧩 Handle change in subject assignment
  const handleChange = (subjectId, field, value) => {
    setAssignments((prev) => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || {}), [field]: value },
    }));
  };

  // 🧩 Submit assignment
  const handleSubmit = async () => {
    if (!selectedClass) {
      message.warning("Please select a class first!");
      return;
    }

    const formattedAssignments = Object.entries(assignments).map(
      ([subjectId, { teacherId, periodPerWeek, isCompulsory }]) => ({
        subjectId,
        teacherId,
        periodPerWeek: periodPerWeek || 0,
        isCompulsory: isCompulsory ?? true,
      })
    );

    setLoading(true);
    try {
      const res = await axios.post("/api/class/assign-subjects", {
        classId: selectedClass,
        assignments: formattedAssignments,
      });
      message.success("Subjects assigned successfully!");
      console.log("Response:", res.data);
      setAssignments({});
    } catch (err) {
      console.error(err);
      message.error("Failed to assign subjects");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Table columns
  const columns = [
    {
      title: "Subject Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Assign Teacher",
      dataIndex: "_id",
      key: "teacher",
      render: (subjectId) => (
        <Select
          className="w-full"
          placeholder="Select Teacher"
          onChange={(value) => handleChange(subjectId, "teacherId", value)}
          value={assignments[subjectId]?.teacherId || undefined}
        >
          {users
            ?.filter((u) => u.role?.toLowerCase() === "teacher")
            ?.map((t) => (
              <Option key={t._id} value={t._id}>
                {t.name}
              </Option>
            ))}
        </Select>
      ),
    },
    {
      title: "Periods/Week",
      dataIndex: "_id",
      key: "periodPerWeek",
      render: (subjectId) => (
        <InputNumber
          min={0}
          className="w-24"
          onChange={(value) => handleChange(subjectId, "periodPerWeek", value)}
          value={assignments[subjectId]?.periodPerWeek || 0}
        />
      ),
    },
    {
      title: "Compulsory",
      dataIndex: "_id",
      key: "isCompulsory",
      render: (subjectId) => (
        <Checkbox
          checked={assignments[subjectId]?.isCompulsory ?? true}
          onChange={(e) => handleChange(subjectId, "isCompulsory", e.target.checked)}
        />
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Assign Subjects to Class
      </h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Select School
          </label>
          <Select
            showSearch
            placeholder="Select a School"
            className="w-full"
            onChange={(val) => {
              setSelectedSchool(val);
              setSelectedClass(null);
              setAssignments({});
            }}
            value={selectedSchool || undefined}
          >
            {schools?.map((school) => (
              <Option key={school._id} value={school._id}>
                {school.name}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Select Class
          </label>
          <Select
            showSearch
            placeholder="Select Class"
            className="w-full"
            onChange={(val) => setSelectedClass(val)}
            value={selectedClass || undefined}
          >
            {classes?.map((cls) => (
              <Option key={cls._id} value={cls._id}>
                {cls.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {selectedClass && (
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={subjects}
            rowKey="_id"
            pagination={false}
            bordered
            className="rounded-xl overflow-hidden"
          />

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              className="!bg-blue-600 hover:!bg-blue-700"
              onClick={handleSubmit}
              loading={loading}
            >
              Assign Subjects
            </Button>
          </div>
        </Spin>
      )}
    </div>
  );
};

export default AssignSubjectsForm;

import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Switch,
  message,
  Spin,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
} from "antd";

const SchoolClass = () => {
  const [classes, setClasses] = useState([]);
  const [schoolClasses, setSchoolClasses] = useState([]);
  const [sections, setSections] = useState({});
  const [sectionInputs, setSectionInputs] = useState({});
  const [loading, setLoading] = useState(false);

  const schoolId = "123";

  // 🔹 Fetch master classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.data || []);
    } catch {
      message.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch school classes
  const fetchSchoolClasses = async () => {
    try {
      const res = await fetch(`/api/school-classes/${schoolId}`);
      const data = await res.json();
      setSchoolClasses(data.data || []);
    } catch {
      message.error("Failed to load school classes");
    }
  };

  // 🔹 Fetch sections
  const fetchSections = async () => {
    try {
      const res = await fetch(`/api/sections/${schoolId}`);
      const data = await res.json();

      // group by schoolClassId
      const grouped = {};
      data.data.forEach((sec) => {
        if (!grouped[sec.schoolClassId]) {
          grouped[sec.schoolClassId] = [];
        }
        grouped[sec.schoolClassId].push(sec);
      });

      setSections(grouped);
    } catch {
      message.error("Failed to load sections");
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchSchoolClasses();
    fetchSections();
  }, []);

  const isChecked = (classId) => {
    return schoolClasses.some((sc) => sc.classId === classId);
  };

  const getSchoolClassId = (classId) => {
    return schoolClasses.find((sc) => sc.classId === classId)?._id;
  };

  // 🔹 Toggle class
  const handleToggle = async (cls) => {
    try {
      setLoading(true);

      const exists = schoolClasses.find(
        (sc) => sc.classId === cls._id
      );

      if (exists) {
        await fetch(`/api/school-classes/${exists._id}`, {
          method: "DELETE",
        });
        message.success("Class removed");
      } else {
        await fetch("/api/school-classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, classId: cls._id }),
        });
        message.success("Class added");
      }

      fetchSchoolClasses();
    } catch {
      message.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Add section
  const handleAddSection = async (classId) => {
    const name = sectionInputs[classId];
    const schoolClassId = getSchoolClassId(classId);

    if (!name) return message.warning("Enter section name");

    try {
      await fetch("/api/sections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          schoolClassId,
          name,
        }),
      });

      message.success("Section added ✅");

      setSectionInputs((prev) => ({ ...prev, [classId]: "" }));
      fetchSections();
    } catch {
      message.error("Failed to add section");
    }
  };

  // 🔹 Delete section
  const handleDeleteSection = async (id) => {
    try {
      await fetch(`/api/sections/${id}`, {
        method: "DELETE",
      });

      message.success("Section deleted");
      fetchSections();
    } catch {
      message.error("Delete failed");
    }
  };

  // 🔹 Table columns
  const columns = [
    {
      title: "Class",
      dataIndex: "name",
    },
    {
      title: "Assign",
      render: (_, record) => (
        <Switch
          checked={isChecked(record._id)}
          onChange={() => handleToggle(record)}
        />
      ),
    },
    {
      title: "Sections",
      render: (_, record) => {
        const schoolClassId = getSchoolClassId(record._id);
        const classSections = sections[schoolClassId] || [];

        if (!isChecked(record._id)) {
          return <span style={{ color: "#999" }}>Assign class first</span>;
        }

        return (
          <div>
            {/* Existing Sections */}
            <div style={{ marginBottom: 8 }}>
              {classSections.map((sec) => (
                <Popconfirm
                  key={sec._id}
                  title="Delete section?"
                  onConfirm={() => handleDeleteSection(sec._id)}
                >
                  <Tag color="blue" style={{ cursor: "pointer" }}>
                    {sec.name} ❌
                  </Tag>
                </Popconfirm>
              ))}
            </div>

            {/* Add Section */}
            <Space>
              <Input
                placeholder="Add section (A, B...)"
                value={sectionInputs[record._id] || ""}
                onChange={(e) =>
                  setSectionInputs({
                    ...sectionInputs,
                    [record._id]: e.target.value,
                  })
                }
                style={{ width: 120 }}
              />
              <Button
                size="small"
                type="primary"
                onClick={() => handleAddSection(record._id)}
              >
                Add
              </Button>
            </Space>
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title="Assign Classes & Manage Sections"
      style={{ maxWidth: 900, margin: "auto" }}
    >
      <Spin spinning={loading}>
        <Table
          dataSource={classes}
          columns={columns}
          rowKey="_id"
          pagination={false}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClass;
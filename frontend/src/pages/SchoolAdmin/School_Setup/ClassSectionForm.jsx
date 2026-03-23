import React, { useEffect, useState } from "react";
import {
  Card,
  Select,
  Input,
  Button,
  message,
  Space,
  Tag,
} from "antd";

const { Option } = Select;

const ClassSectionForm = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [sectionsInput, setSectionsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const schoolId = "123";

  // 🔹 Fetch classes
  const fetchClasses = async () => {
    const res = await fetch("/api/classes");
    const data = await res.json();
    setClasses(data.data || []);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // 🔹 Submit form
  const handleSubmit = async () => {
    if (!selectedClass) {
      return message.warning("Select class");
    }

    if (!sectionsInput) {
      return message.warning("Enter sections");
    }

    // 👉 Convert "A,B,C" → ["A","B","C"]
    const sectionsArray = sectionsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    try {
      setLoading(true);

      // 1️⃣ Create School Class
      const classRes = await fetch("/api/school-classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          classId: selectedClass,
        }),
      });

      const classData = await classRes.json();
      const schoolClassId = classData.data._id;

      // 2️⃣ Create Sections (bulk)
      await Promise.all(
        sectionsArray.map((name) =>
          fetch("/api/sections", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              schoolId,
              schoolClassId,
              name,
            }),
          })
        )
      );

      message.success("Class & Sections Created ✅");

      // reset
      setSelectedClass(null);
      setSectionsInput("");
    } catch (err) {
      message.error("Failed to create",err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Create Class with Sections"
      style={{ maxWidth: 500, margin: "auto" }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        
        {/* 🔹 Class Select */}
        <Select
          placeholder="Select Class"
          value={selectedClass}
          onChange={setSelectedClass}
        >
          {classes.map((cls) => (
            <Option key={cls._id} value={cls._id}>
              {cls.name}
            </Option>
          ))}
        </Select>

        {/* 🔹 Section Input */}
        <Input
          placeholder="Enter Sections (A,B,C)"
          value={sectionsInput}
          onChange={(e) => setSectionsInput(e.target.value)}
        />

        {/* 🔹 Preview */}
        <div>
          {sectionsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s, i) => (
              <Tag key={i}>{s.toUpperCase()}</Tag>
            ))}
        </div>

        {/* 🔹 Submit */}
        <Button
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </Space>
    </Card>
  );
};

export default ClassSectionForm;
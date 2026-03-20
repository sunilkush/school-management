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
import { useDispatch, useSelector } from "react-redux";

import { fetchAllClasses } from "../../../features/classSlice.js";
import {
  fetchSchoolClasses,
  createSchoolClass,
  deleteSchoolClass,
} from "../../../features/schoolClassSlice";
import {currentUser} from "../../../features/authSlice.js";
import {
  fetchSections,
  createSection,
  deleteSection,
} from "../../../features/sectionSlice";

const SchoolClass = () => {
  const dispatch = useDispatch();

  // 🔥 GLOBAL STATE
  const { classList, loading } = useSelector((state) => state.class);
  const { schoolClasses } = useSelector((state) => state.schoolClass);
  const { sections } = useSelector((state) => state.section);
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);
  const { user } = useSelector((state) => state.auth);
  
  // 🔥 DYNAMIC IDS
  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [sectionInputs, setSectionInputs] = useState({});
  
  // =========================
  // 🔥 LOAD DATA
  // =========================
  useEffect(() => {
    dispatch(currentUser());
    dispatch(fetchAllClasses());
    if (!schoolId || !academicYearId) return;
    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    dispatch(fetchSections({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  // =========================
  // 🔹 HELPERS
  // =========================
  const isChecked = (classId) => {
    return schoolClasses.some((sc) => sc.classId === classId);
  };

  const getSchoolClassId = (classId) => {
    return schoolClasses.find((sc) => sc.classId === classId)?._id;
  };

  const getSectionsByClass = (schoolClassId) => {
    return sections.filter(
      (sec) => sec.schoolClassId === schoolClassId
    );
  };

  // =========================
  // 🔥 TOGGLE CLASS
  // =========================
  const handleToggle = async (cls) => {
    try {
      const exists = schoolClasses.find(
        (sc) => sc.classId === cls._id
      );

      if (exists) {
        await dispatch(deleteSchoolClass(exists._id)).unwrap();
        message.success("Class removed");
      } else {
       
        await dispatch(
          createSchoolClass({
            schoolId,
            academicYearId,
            classId: cls._id,
            boardClassId: cls.boardClassId, // ⚠️ ensure exists
          })
        ).unwrap();
        message.success("Class added");
      }

      dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
    } catch (err) {
      message.error(err);
    }
  };

  // =========================
  // 🔥 ADD SECTION
  // =========================
  const handleAddSection = async (classId) => {
    const input = sectionInputs[classId];
    const schoolClassId = getSchoolClassId(classId);

    if (!input) return message.warning("Enter section");

    const names = input.split(",").map((n) => n.trim().toUpperCase());

    try {
      for (const name of names) {
        await dispatch(
          createSection({
            schoolId,
            academicYearId,
            schoolClassId,
            name,
          })
        ).unwrap();
      }

      message.success("Sections added");
      setSectionInputs({ ...sectionInputs, [classId]: "" });

      dispatch(fetchSections({ schoolId, academicYearId }));
    } catch (err) {
      message.error(err);
    }
  };

  // =========================
  // 🔥 DELETE SECTION
  // =========================
  const handleDeleteSection = async (id) => {
    try {
      await dispatch(deleteSection(id)).unwrap();
      message.success("Deleted");

      dispatch(fetchSections({ schoolId, academicYearId }));
    } catch (err) {
      message.error(err);
    }
  };

  // =========================
  // 🔹 TABLE
  // =========================
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
        const classSections = getSectionsByClass(schoolClassId);

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
                placeholder="A,B,C"
                value={sectionInputs[record._id] || ""}
                onChange={(e) =>
                  setSectionInputs({
                    ...sectionInputs,
                    [record._id]: e.target.value,
                  })
                }
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
    <Card title="🔥 Dynamic Class & Section Management">
      <Spin spinning={loading}>
        <Table
          dataSource={classList}
          columns={columns}
          rowKey="_id"
          pagination={false}
        />
      </Spin>
    </Card>
  );
};

export default SchoolClass;
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Select,
  Button,
  Typography,
  Space,
  Tag,
  message,
} from "antd";
import {
  UserOutlined,
  ApartmentOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllUser } from "../../../features/authSlice";
import {
  assignClassTeacher,
  fetchSections,
} from "../../../features/sectionSlice.js";


const { Title } = Typography;
const { Option } = Select;

const SchoolClassSectionTeacher = ({ next }) => {
  const dispatch = useDispatch();

  const { sections = [] } = useSelector((s) => s.section || {});
  const { users = [], user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [teacherMap, setTeacherMap] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  /* ───────── FETCH ───────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSections({ schoolId, academicYearId }));
    }

    dispatch(
      fetchAllUser({
        roleName: ["Teacher"], // ✅ correct case
        isActive: true,
      })
    );
  }, [dispatch, schoolId, academicYearId]);

  /* ───────── GET TEACHER NAME ───────── */
  const getTeacherName = (record) => {
    const selectedId = teacherMap[record.key];

    // ✅ if user just selected new teacher
    if (selectedId) {
      const t = users.find((u) => u._id === selectedId);
      return t?.name;
    }

    // ✅ backend data
    return record.teacherName || "Not Assigned";
  };

  /* ───────── TABLE DATA ───────── */
  const tableData = useMemo(() => {
    const arr = [];

    sections.forEach((cls) => {
      cls.sections?.forEach((sec) => {
        if (!sec?._id) return;

        arr.push({
          key: `${cls._id}-${sec._id}`,
          classId: cls._id,
          className: cls.name,
          sectionId: sec._id,
          sectionName: sec.name,

          // ✅ IMPORTANT FIX
          teacherId: sec.classTeacherId?._id || null,
          teacherName: sec.classTeacherId?.name || null,
        });
      });
    });

    return arr;
  }, [sections]);

  /* ───────── SELECT CHANGE ───────── */
  const handleTeacherChange = (value, record) => {
    setTeacherMap((prev) => ({
      ...prev,
      [record.key]: value,
    }));
  };

  /* ───────── SAVE ───────── */
  const handleSave = async (record) => {
    const teacherId = teacherMap[record.key] || record.teacherId;

    if (!teacherId) {
      return message.error("Please select teacher");
    }

    try {
      setSavingKey(record.key);

      await dispatch(
        assignClassTeacher({
          sectionId: record.sectionId,
          teacherId,
        })
      ).unwrap();

      message.success(
        `${record.className} - ${record.sectionName} updated`
      );

      // ✅ instant UI update
      const selectedTeacher = users.find((u) => u._id === teacherId);

      record.teacherId = teacherId;
      record.teacherName = selectedTeacher?.name;

      setTeacherMap((prev) => {
        const newMap = { ...prev };
        delete newMap[record.key];
        return newMap;
      });
    } catch (err) {
      message.error("Failed to assign teacher");
    } finally {
      setSavingKey(null);
    }
  };

  /* ───────── COLUMNS ───────── */
  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      render: (val) => <Tag>{val}</Tag>,
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      render: (val) => <Tag color="purple">{val}</Tag>,
    },
    {
      title: "Teacher",
      render: (_, record) => {
        const teacherId =
          teacherMap[record.key] ?? record.teacherId;

        return (
          <Space direction="vertical">
            {/* ✅ SHOW NAME */}
            <Tag icon={<UserOutlined />} color="blue">
              {getTeacherName(record)}
            </Tag>

            {/* ✅ SELECT */}
            <Select
              placeholder="Select Teacher"
              style={{ width: 200 }}
              value={teacherId}
              onChange={(val) =>
                handleTeacherChange(val, record)
              }
              showSearch
              optionFilterProp="children"
            >
              {users.map((u) => (
                <Option key={u._id} value={u._id}>
                  {u.name}
                </Option>
              ))}
            </Select>
          </Space>
        );
      },
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={savingKey === record.key}
          onClick={() => handleSave(record)}
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <ApartmentOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Class Section Teacher Assignment
          </Title>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowKey="key"
      />

      <div style={{ textAlign: "right", marginTop: 20 }}>
        <Button type="primary" onClick={next}>
          Finish Setup
        </Button>
      </div>
    </Card>
  );
};

export default SchoolClassSectionTeacher;
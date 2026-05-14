import React, { useEffect, useMemo, useState } from "react";

import {
  Card,
  Table,
  Select,
  Typography,
  Space,
  Tag,
  message,
  Avatar,
  Spin,
  Grid,
} from "antd";
import {
  UserOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllUser } from "../../../../features/authSlice";
import {
  assignClassTeacher,
  fetchSections,
} from "../../../../features/sectionSlice.js";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const SchoolClassSectionTeacher = ({ next }) => {
  const dispatch = useDispatch();

  /* ✅ FIX: Hook inside component */
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { sections = [], loading } = useSelector((s) => s.section || {});
  const { users = [], user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;

  const [savingKey, setSavingKey] = useState(null);
 
  /* ───────── FETCH ───────── */
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchSections({ schoolId, academicYearId }));
    }

    dispatch(
      fetchAllUser({
        roleName: ["Teacher"],
        isActive: true,
      })
    );
  }, [dispatch, schoolId, academicYearId]);

  /* ───────── TABLE DATA ───────── */
  const tableData = useMemo(() => {
    return sections.map((sec) => ({
      key: sec._id,
      classId: sec.schoolClassId?._id,
      className: sec.schoolClassId?.name || "N/A",
      sectionId: sec._id,
      sectionName: sec.name,
      teacherId: sec.classTeacherId?._id || null,
    }));
  }, [sections]);
  const isAllAssigned =
    tableData.length > 0 && tableData.every((item) => item.teacherId);
  /* ───────── SAVE ───────── */
  const handleTeacherChange = async (value, record) => {
    try {
      setSavingKey(record.key);

      await dispatch(
        assignClassTeacher({
          sectionId: record.sectionId,
          teacherId: value,
        })
      ).unwrap();

       message.success(`${record.className} - ${record.sectionName} updated`);
    } catch (err) {
       const errorMessage =
        err?.message || err?.response?.data?.message || "Failed to assign teacher";
      message.error(errorMessage);
    } finally {
      setSavingKey(null);
    }
  };

  /* ───────── COLUMNS ───────── */
  const columns = [
    {
      title: "Class",
      dataIndex: "className",
      render: (val) => <Tag color="geekblue">{val}</Tag>,
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      render: (val) => <Tag color="purple">{val}</Tag>,
    },
    {
      title: "Teacher",
      render: (_, record) => {
        const selectedTeacher = users.find(
          (u) => u._id === record.teacherId
        );

        return (
          <Space direction="vertical" size={4}>
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              <Text strong>
                {selectedTeacher?.name || "Not Assigned"}
              </Text>
              {savingKey === record.key && <Spin size="small" />}
            </Space>

            <Select
              placeholder="Select Teacher"
              value={record.teacherId || undefined}
              onChange={(val) => handleTeacherChange(val, record)}
              style={{ width: isMobile ? "100%" : 200 }}
              size="small"
               loading={savingKey === record.key}
              disabled={savingKey === record.key}
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
  ];
     const handleFinish = () => {
      message.success("🎉 School setup completed successfully!");
 

  // optional delay for UX
  setTimeout(() => {
    next && next();
  }, 800);
};
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
      title={
        <Space>
          <ApartmentOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Class Section Teacher Assignment
          </Title>
        </Space>
      }
    >
      {/* ✅ MOBILE VIEW (CARD UI) */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <Spin />
          ) : tableData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              No Data Found
            </div>
          ) : (
            tableData.map((item) => {
              const selectedTeacher = users.find(
                (u) => u._id === item.teacherId
              );

              return (
                <div
                  key={item.key}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div><b>Class:</b> {item.className}</div>
                  <div><b>Section:</b> {item.sectionName}</div>

                  <div style={{ marginTop: 8 }}>
                    <b>Teacher:</b>
                    <Select
                      value={item.teacherId}
                      onChange={(val) =>
                        handleTeacherChange(val, item)
                      }
                      style={{ width: "100%", marginTop: 5 }}
                      size="small"
                    >
                      {users.map((u) => (
                        <Option key={u._id} value={u._id}>
                          {u.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary">
                      {selectedTeacher?.name || "Not Assigned"}
                    </Text>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ✅ DESKTOP TABLE */
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="key"
          pagination={false}
          loading={loading}
        />
      )}
   
      {/* NEXT BUTTON */}
      <div style={{ textAlign: "right", marginTop: 20 }}>
        <button
         onClick={handleFinish}
         disabled={!isAllAssigned}
          style={{
            
             background: isAllAssigned ? "#1677ff" : "#ccc",
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: "10px",
            fontWeight: 600,
            cursor: isAllAssigned ? "pointer" : "not-allowed",
          }}
        >
          Finish Setup →
        </button>
      </div>
    </Card>
  );
};

export default SchoolClassSectionTeacher;
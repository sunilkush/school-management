import React, { useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Avatar,
  Divider,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAssignedClasses } from "../../../features/classSlice.js";


const { Title, Text } = Typography;

const AssignedClasses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { classAssignTeacher = [], loading = false } = useSelector(
    (state) => state.class || {}
  );

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );

  const teacherId = user?._id;
  const schoolId = user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;



  useEffect(() => {
    if (teacherId && schoolId && academicYearId) {
      dispatch(
        fetchAssignedClasses({
          teacherId,
          schoolId,
          academicYearId,
        })
      );
    }
  }, [dispatch, teacherId, schoolId, academicYearId]);


  return (
    <div style={{ padding: "10px", background: "#f6f8fb", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          📚 My Assigned Classes
        </Title>
        <Text type="secondary">
          Manage your classes, subjects & students easily
        </Text>
      </div>

      <Spin spinning={loading}>
        {!loading && (!classAssignTeacher || classAssignTeacher.length === 0) ? (
          <Card style={{ borderRadius: 16 }}>
            <Empty description="No Classes Assigned Yet" />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {classAssignTeacher?.map((cls) => (
              <Col xs={24} sm={12} lg={8} key={cls?._id}>
                <Card
                  hoverable
                  style={{ borderRadius: 18 }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>

                    {/* Header */}
                    <Space
                      align="center"
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Space>
                        <Avatar
                          size={48}
                          style={{ background: "#1677ff" }}
                          icon={<BookOutlined />}
                        />
                        <div>
                          <Title level={5} style={{ margin: 0 }}>
                            {cls?.name || "Class"}
                          </Title>

                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Sections:{" "}
                            {cls?.sections?.length
                              ? cls.sections
                                  .map((sec) => sec?.sectionId?.name)
                                  .filter(Boolean)
                                  .join(", ")
                              : "N/A"}
                          </Text>
                        </div>
                      </Space>

                      <Tag color="green">Active</Tag>
                    </Space>

                    <Divider style={{ margin: "10px 0" }} />

                    {/* Subjects */}
                    <div>
                      <Text strong>Subjects</Text>
                      <div style={{ marginTop: 8 }}>
                        {cls?.subjects?.length ? (
                          cls.subjects.map((sub, i) => (
                            <Tag color="blue" key={i}>
                              {sub?.subjectId?.name || "Subject"}
                            </Tag>
                          ))
                        ) : (
                          <Text type="secondary">No Subjects</Text>
                        )}
                      </div>
                    </div>

                    {/* Students */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Space>
                        <TeamOutlined />
                        <Text strong>
                          {cls?.studentCount ?? 0} Students
                        </Text>
                      </Space>

                      <Tag icon={<CheckCircleOutlined />} color="processing">
                        Running
                      </Tag>
                    </div>

                    {/* Actions */}
                    <Space style={{ marginTop: 12 }}>
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() =>
                          cls?._id &&
                          navigate(`/dashboard/teacher/classes/${cls._id}`)
                        }
                      >
                        View Class
                      </Button>

                      <Button
                        onClick={() =>
                          cls?._id &&
                          navigate(
                            `/dashboard/teacher/attendance?classId=${cls._id}&className=${encodeURIComponent(
                              cls?.name || ""
                            )}`
                          )
                        }
                      >
                        Take Attendance
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default AssignedClasses;
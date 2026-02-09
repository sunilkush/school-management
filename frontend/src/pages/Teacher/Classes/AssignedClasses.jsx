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
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssignedClasses } from "../../../features/classSlice.js";

const { Title, Text } = Typography;

const AssignedClasses = () => {
  const dispatch = useDispatch();

  const { classAssignTeacher = [], loading } = useSelector(
    (state) => state.class || {}
  );

  /* ================= LOCAL STORAGE ================= */

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const academic = JSON.parse(
    localStorage.getItem("selectedAcademicYear") || "{}"
  );

  const TeacherId = user?._id;
  const schoolId = academic?.schoolId;
  const academicYearId = academic?._id;

  /* ================= FETCH ================= */

  useEffect(() => {
    if (TeacherId && schoolId && academicYearId) {
      dispatch(
        fetchAssignedClasses({
          teacherId: TeacherId,
          schoolId,
          academicYearId,
        })
      );
    }
  }, [dispatch, TeacherId, schoolId, academicYearId]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 20 }}>
      <Title level={3} style={{ marginBottom: 20 }}>
        My Assigned Classes
      </Title>

      <Spin spinning={loading}>
        {!classAssignTeacher?.length ? (
          <Empty description="No Classes Assigned Yet" />
        ) : (
          <Row gutter={[20, 20]}>
            {classAssignTeacher.map((cls) => (
              <Col xs={24} sm={12} lg={8} key={cls._id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    
                    {/* ===== Class Name ===== */}
                    <Space align="center">
                      <BookOutlined style={{ fontSize: 20 }} />
                      <Title level={4} style={{ margin: 0 }}>
                        {cls?.name || "Class"}
                      </Title>
                    </Space>

                    {/* ===== Sections ===== */}
                    <Text type="secondary">
                      Section :{" "}
                      {cls?.sections?.length
                        ? cls.sections
                            .map((sec) => sec.sectionId?.name)
                            .join(", ")
                        : "N/A"}
                    </Text>

                    {/* ===== Subjects ===== */}
                    <div>
                      <Text strong>Subjects :</Text>
                      <div style={{ marginTop: 6 }}>
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

                    {/* ===== Students ===== */}
                    <Space>
                      <TeamOutlined />
                      <Text>
                        {cls?.studentCount || 0} Students
                      </Text>
                    </Space>

                    {/* ===== Actions ===== */}
                    <Space style={{ marginTop: 12 }}>
                      <Button type="primary" icon={<EyeOutlined />}>
                        View Class
                      </Button>

                      <Button>
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

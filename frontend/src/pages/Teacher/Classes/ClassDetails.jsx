import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { fetchAssignedClasses } from "../../../features/classSlice";
import memoryStorage from "../../../utils/memoryStorage";

const { Title, Text } = Typography;

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { classAssignTeacher = [], loading } = useSelector((state) => state.class || {});

  const user = JSON.parse(memoryStorage.getItem("user") || "{}");
  const academic = JSON.parse(memoryStorage.getItem("selectedAcademicYear") || "{}");

  const teacherId = user?._id;
  const schoolId = academic?.schoolId;
  const academicYearId = academic?._id;

  useEffect(() => {
    if (!classAssignTeacher.length && teacherId && schoolId && academicYearId) {
      dispatch(fetchAssignedClasses({ teacherId, schoolId, academicYearId }));
    }
  }, [dispatch, classAssignTeacher.length, teacherId, schoolId, academicYearId]);

  const classData = useMemo(
    () => classAssignTeacher.find((item) => item?._id === classId),
    [classAssignTeacher, classId]
  );

  return (
    <div style={{ padding: 20 }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard/teacher/classes")}>
          Back to Classes
        </Button>

        <Spin spinning={loading}>
          {!classData ? (
            <Empty description="Class details not found" />
          ) : (
            <>
              <Card style={{ borderRadius: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                  {classData?.name || "Class"}
                </Title>
                <Text type="secondary">
                  Sections: {classData?.sections?.map((sec) => sec?.sectionId?.name).filter(Boolean).join(", ") || "N/A"}
                </Text>
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Subjects" style={{ borderRadius: 16 }}>
                    {classData?.subjects?.length ? (
                      classData.subjects.map((sub) => (
                        <Tag key={sub?._id || sub?.subjectId?._id} color="blue" style={{ marginBottom: 8 }}>
                          {sub?.subjectId?.name || "Subject"}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">No subjects assigned</Text>
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Summary" style={{ borderRadius: 16 }}>
                    <Space direction="vertical" size={8}>
                      <Text>Students: {classData?.studentCount || 0}</Text>
                      <Text>Subject Count: {classData?.subjects?.length || 0}</Text>
                      <Text>Section Count: {classData?.sections?.length || 0}</Text>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Alert
                type="info"
                showIcon
                message="Tip"
                description="Attendance button on classes page now opens teacher attendance screen with the selected class prefilled."
              />
            </>
          )}
        </Spin>
      </Space>
    </div>
  );
};

export default ClassDetails;

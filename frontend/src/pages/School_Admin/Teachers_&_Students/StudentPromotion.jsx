import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Form, Select, Space, Table, Typography, message } from "antd";
import {
  clearPromotionCandidates,
  fetchPromotionAcademicYears,
  fetchPromotionCandidates,
  fetchPromotionClasses,
  fetchPromotionSections,
  promoteStudents,
} from "../../../features/studentPromotionSlice";

const { Title, Text } = Typography;

const StudentPromotion = () => {
  const dispatch = useDispatch();
  const { academicYears, sourceClasses, targetClasses, sections, candidates, loading, promoting } = useSelector(
    (state) => state.studentPromotion
  );

  const [fromAcademicYearId, setFromAcademicYearId] = useState(null);
  const [toAcademicYearId, setToAcademicYearId] = useState(null);
  const [sourceClassId, setSourceClassId] = useState(null);
  const [targetClassId, setTargetClassId] = useState(null);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    dispatch(fetchPromotionAcademicYears())
      .unwrap()
      .then((years) => {
        const active = years.find((y) => y.isActive);
        if (active?._id) setFromAcademicYearId(active._id);
      })
      .catch((err) => message.error(err || "Failed to load academic years"));
  }, [dispatch]);

  useEffect(() => {
    if (!fromAcademicYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: fromAcademicYearId, mode: "source" })).catch(() => {});
    setSourceClassId(null);
    setSelectedRowKeys([]);
    dispatch(clearPromotionCandidates());
  }, [dispatch, fromAcademicYearId]);

  useEffect(() => {
    if (!toAcademicYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: toAcademicYearId, mode: "target" })).catch(() => {});
    setTargetClassId(null);
    setTargetSectionId(null);
  }, [dispatch, toAcademicYearId]);

  useEffect(() => {
    if (!targetClassId) return;
    dispatch(fetchPromotionSections({ schoolClassId: targetClassId })).catch(() => {});
    setTargetSectionId(null);
  }, [dispatch, targetClassId]);

  const handleLoadStudents = () => {
    if (!sourceClassId || !fromAcademicYearId) {
      message.warning("Please select source academic year and class");
      return;
    }

    dispatch(fetchPromotionCandidates({ schoolClassId: sourceClassId, academicYearId: fromAcademicYearId }))
      .unwrap()
      .then(() => setSelectedRowKeys([]))
      .catch((err) => message.error(err || "Failed to load students"));
  };

  const handlePromoteStudents = () => {
    if (!selectedRowKeys.length) {
      message.warning("Please select at least one student");
      return;
    }

    if (!fromAcademicYearId || !toAcademicYearId || !targetClassId || !targetSectionId) {
      message.warning("Please select all promotion details first");
      return;
    }

    dispatch(
      promoteStudents({
        fromAcademicYearId,
        toAcademicYearId,
        toSchoolClassId: targetClassId,
        toSectionId: targetSectionId,
        enrollmentIds: selectedRowKeys,
      })
    )
      .unwrap()
      .then((result) => {
        const promotedCount = result?.promotedCount || 0;
        message.success(`${promotedCount} students promoted successfully`);
        setSelectedRowKeys([]);
        handleLoadStudents();
      })
      .catch((err) => message.error(err || "Failed to promote students"));
  };

  const columns = useMemo(
    () => [
      { title: "Reg. No", dataIndex: "registrationNumber", key: "registrationNumber" },
      { title: "Name", dataIndex: "name", key: "name" },
      { title: "Email", dataIndex: "email", key: "email" },
      { title: "Current Class", dataIndex: "currentClass", key: "currentClass" },
      { title: "Current Section", dataIndex: "currentSection", key: "currentSection" },
    ],
    []
  );

  return (
    <>
    <Card style={{margin:`24px`,backgroundColor:'#fff'}}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            Student Promotion
          </Title>
          <Text type="secondary">
            Select students, choose target class/section, and promote them to the next academic year.
          </Text>
        </div>

        <Form layout="vertical">
          <Space wrap size="middle" style={{ width: "100%" }}>
            <Form.Item label="From Academic Year" style={{ minWidth: 220 }}>
              <Select
                value={fromAcademicYearId}
                placeholder="Select source year"
                options={academicYears.map((y) => ({ label: y.name, value: y._id }))}
                onChange={setFromAcademicYearId}
              />
            </Form.Item>

            <Form.Item label="Current Class" style={{ minWidth: 220 }}>
              <Select
                value={sourceClassId}
                placeholder="Select current class"
                options={sourceClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
                onChange={setSourceClassId}
              />
            </Form.Item>

            <Form.Item label="To Academic Year" style={{ minWidth: 220 }}>
              <Select
                value={toAcademicYearId}
                placeholder="Select target year"
                options={academicYears
                  .filter((y) => y._id !== fromAcademicYearId)
                  .map((y) => ({ label: y.name, value: y._id }))}
                onChange={setToAcademicYearId}
              />
            </Form.Item>

            <Form.Item label="Target Class" style={{ minWidth: 220 }}>
              <Select
                value={targetClassId}
                placeholder="Select target class"
                options={targetClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
                onChange={setTargetClassId}
              />
            </Form.Item>

            <Form.Item label="Target Section" style={{ minWidth: 220 }}>
              <Select
                value={targetSectionId}
                placeholder="Select target section"
                options={sections.map((sec) => ({ label: sec.name, value: sec._id }))}
                onChange={setTargetSectionId}
              />
            </Form.Item>

            <Form.Item label=" " style={{ marginTop: 6 }}>
              <Button type="default" onClick={handleLoadStudents} disabled={!sourceClassId || !fromAcademicYearId}>
                Load Students
              </Button>
            </Form.Item>
          </Space>
        </Form>

        {!candidates.length ? <Alert type="info" showIcon message="No students found for selected class/year" /> : null}

        <Table
          rowKey="enrollmentId"
          loading={loading}
          dataSource={candidates}
          columns={columns}
          pagination={{ pageSize: 20 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />

        <Space>
          <Text strong>{selectedRowKeys.length} selected</Text>
          <Button type="primary" onClick={handlePromoteStudents} loading={promoting}>
            Promote Selected Students
          </Button>
        </Space>
      </Space>
    </Card>
    </>
  );
};

export default StudentPromotion;

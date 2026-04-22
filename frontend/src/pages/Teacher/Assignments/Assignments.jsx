import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Statistic,
  Modal,
  Form,
  DatePicker,
  Empty,
  message,
} from "antd";
import {
  FileTextOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { fetchAssignedClasses } from "../../../features/classSlice";

const { Title, Text } = Typography;

const statusColors = {
  active: "green",
  pending: "orange",
  completed: "blue",
  overdue: "red",
};

const Assignments = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear || {}
  );
  const { classAssignTeacher = [], loading: classLoading } = useSelector(
    (state) => state.class || {}
  );

  const [searchText, setSearchText] = useState("");
  const [selectedClassKey, setSelectedClassKey] = useState(undefined);
  const [selectedSectionName, setSelectedSectionName] = useState(undefined);

  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedModalSectionId, setSelectedModalSectionId] = useState("");

  const getId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
  }, [dispatch, selectedAcademicYear?._id]);

  const teacherClassOptions = useMemo(() => {
    return classAssignTeacher.map((cls) => ({
      classId: String(getId(cls?._id)),
      className:
        cls?.className ||
        cls?.name ||
        cls?.schoolClassName ||
        `Class ${cls?.classNum || ""}`.trim() ||
        "Class",
      sections: (cls?.sections || []).map((sec) => ({
        sectionId: String(getId(sec?.sectionId?._id || sec?.sectionId)),
        sectionName: sec?.sectionId?.name || sec?.name || "Section",
        subjects: (sec?.subjects || []).map((sub) => ({
          subjectId: String(
            getId(sub?.subjectId?._id || sub?.subjectId || sub?._id)
          ),
          subjectName:
            sub?.subjectId?.name || sub?.name || sub?.subjectName || "",
        })),
      })),
      subjects: (cls?.subjects || []).map((sub) => ({
        subjectId: String(
          getId(sub?.subjectId?._id || sub?.subjectId || sub?._id)
        ),
        subjectName: sub?.subjectId?.name || sub?.name || sub?.subjectName || "",
      })),
    }));
  }, [classAssignTeacher]);

  const sectionOptions = useMemo(() => {
    const selectedClass = teacherClassOptions.find(
      (item) => item.classId === selectedClassKey
    );
    return selectedClass?.sections || [];
  }, [teacherClassOptions, selectedClassKey]);

  const classOptions = useMemo(
    () =>
      teacherClassOptions.map((cls) => ({
        value: cls.classId,
        label: cls.className,
      })),
    [teacherClassOptions]
  );

  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    return (
      teacherClassOptions.find(
        (cls) => String(cls.classId) === String(selectedClassId)
      ) || null
    );
  }, [selectedClassId, teacherClassOptions]);

  const modalSectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    return (selectedClass.sections || []).map((sec) => ({
      value: sec.sectionId,
      label: sec.sectionName,
    }));
  }, [selectedClass]);

  const subjectOptions = useMemo(() => {
    if (!selectedClass) return [];

    const subjectMap = new Map();

    const addSubject = (subjectLike) => {
      const subjectId = String(subjectLike?.subjectId || "");
      const subjectName = subjectLike?.subjectName || "";

      if (!subjectId || !subjectName || subjectMap.has(subjectId)) return;
      subjectMap.set(subjectId, { value: subjectName, label: subjectName });
    };

    (selectedClass?.subjects || []).forEach(addSubject);

    if (selectedModalSectionId) {
      const matchedSection = (selectedClass?.sections || []).find(
        (sec) => String(sec.sectionId) === String(selectedModalSectionId)
      );
      (matchedSection?.subjects || []).forEach(addSubject);
    } else {
      (selectedClass?.sections || []).forEach((section) => {
        (section?.subjects || []).forEach(addSubject);
      });
    }

    return Array.from(subjectMap.values());
  }, [selectedClass, selectedModalSectionId]);

  const filteredAssignments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.subject.toLowerCase().includes(keyword);

      const matchesClass = !selectedClassKey || item.classId === selectedClassKey;
      const matchesSection =
        !selectedSectionName || item.section === selectedSectionName;

      return matchesSearch && matchesClass && matchesSection;
    });
  }, [assignments, searchText, selectedClassKey, selectedSectionName]);

  const stats = useMemo(() => {
    const now = dayjs();
    const active = assignments.filter((item) => item.status === "active").length;
    const pendingReview = assignments.filter((item) =>
      dayjs(item.dueDate).isAfter(now, "day")
    ).length;

    return {
      total: assignments.length,
      active,
      pendingReview,
    };
  }, [assignments]);

  const resetModalState = () => {
    form.resetFields();
    setSelectedClassId("");
    setSelectedModalSectionId("");
    setOpen(false);
  };

  const handleCreateAssignment = async () => {
    try {
      const values = await form.validateFields();

      const classInfo = teacherClassOptions.find(
        (item) => item.classId === values.schoolClassId
      );

      const sectionInfo = (classInfo?.sections || []).find(
        (sec) => sec.sectionId === values.sectionId
      );

      const due = dayjs(values.dueDate);
      const status = due.isBefore(dayjs(), "day") ? "overdue" : "active";

      const next = {
        _id: `${Date.now()}`,
        title: values.title,
        classId: values.schoolClassId,
        class: classInfo?.className || "Class",
        section: sectionInfo?.sectionName || "Section",
        subject: values.subject,
        dueDate: due.format("YYYY-MM-DD"),
        status,
        createdBy: user?.name || "Teacher",
      };

      setAssignments((prev) => [next, ...prev]);
      message.success("Assignment created successfully.");
      resetModalState();
    } catch (error) {
      const errorMessage = error?.message || "Failed to create assignment. Please check the form fields.";
      message.error(errorMessage);
    }
  };

  const columns = [
    {
      title: "Assignment",
      dataIndex: "title",
      render: (val, rec) => (
        <Space direction="vertical" size={0}>
          <Text strong>{val}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            By {rec.createdBy}
          </Text>
        </Space>
      ),
    },
    {
      title: "Class",
      render: (_, rec) => (
        <Tag color="blue">
          {rec.class} - {rec.section}
        </Tag>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (val) => dayjs(val).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (val) => (
        <Tag color={statusColors[val] || "default"}>
          {String(val || "").toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20 }}
        gutter={[12, 12]}
      >
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Assignments
          </Title>
          <Text type="secondary">
            Create and manage assignments for your assigned classes.
          </Text>
        </Col>

        <Col>
          <Space wrap>
            <Select
              placeholder="Class"
              style={{ width: 140 }}
              allowClear
              value={selectedClassKey}
              onChange={(value) => {
                setSelectedClassKey(value);
                setSelectedSectionName(undefined);
              }}
              options={teacherClassOptions.map((item) => ({
                value: item.classId,
                label: item.className,
              }))}
            />

            <Select
              placeholder="Section"
              style={{ width: 140 }}
              allowClear
              value={selectedSectionName}
              onChange={setSelectedSectionName}
              disabled={!selectedClassKey}
              options={sectionOptions.map((item) => ({
                value: item.sectionName,
                label: item.sectionName,
              }))}
            />

            <Input
              placeholder="Search assignment"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
              disabled={!teacherClassOptions.length}
            >
              Create Assignment
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Assignments"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Active" value={stats.active} />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Pending Review" value={stats.pendingReview} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={filteredAssignments}
          rowKey="_id"
          loading={classLoading}
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  teacherClassOptions.length
                    ? "No assignments created yet"
                    : "No assigned class found for this teacher"
                }
              />
            ),
          }}
        />
      </Card>

      <Modal
        title="Create Assignment"
        open={open}
        onCancel={resetModalState}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAssignment}
          initialValues={{
            title: "",
            schoolClassId: undefined,
            sectionId: undefined,
            subject: undefined,
            dueDate: null,
          }}
        >
          <Form.Item
            label="Assignment Title"
            name="title"
            rules={[{ required: true, message: "Please enter assignment title" }]}
          >
            <Input placeholder="Enter assignment title" />
          </Form.Item>

          <Form.Item
            label="Class"
            name="schoolClassId"
            rules={[{ required: true, message: "Please select class" }]}
          >
            <Select
              placeholder="Select class"
              loading={classLoading}
              value={selectedClassId || undefined}
              onChange={(value) => {
                setSelectedClassId(value);
                setSelectedModalSectionId("");
                form.setFieldsValue({
                  sectionId: undefined,
                  subject: undefined,
                });
              }}
              options={classOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Section"
            name="sectionId"
            rules={[{ required: true, message: "Please select section" }]}
          >
            <Select
              placeholder={selectedClassId ? "Select section" : "Select class first"}
              disabled={!selectedClassId}
              options={modalSectionOptions}
              onChange={(value) => {
                setSelectedModalSectionId(value);
                form.setFieldsValue({ subject: undefined });
              }}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Please select subject" }]}
          >
            <Select
              placeholder={selectedClassId ? "Select subject" : "Select class first"}
              disabled={!selectedClassId}
              options={subjectOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="Due Date"
            name="dueDate"
            rules={[{ required: true, message: "Please select due date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Create Assignment
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Assignments;
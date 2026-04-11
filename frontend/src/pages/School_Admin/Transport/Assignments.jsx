import React, { useEffect, useMemo, useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteAssignment,
  fetchAssignableStudents,
  fetchAssignments,
  fetchRoutes,
  fetchVehicles,
  saveAssignment,
} from "../../../features/transportSlice";

const { Content } = Layout;

const Assignments = () => {
  const dispatch = useDispatch();
  const { assignments, students, routes, vehicles, loading } = useSelector((state) => state.transport);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchAssignableStudents());
    dispatch(fetchRoutes());
    dispatch(fetchVehicles());
    dispatch(fetchAssignments());
  }, [dispatch]);

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student._id,
        label: `${student.name} (${student.registrationNumber})`,
      })),
    [students]
  );

  const routeOptions = useMemo(
    () => routes.map((route) => ({ value: route._id, label: route.name })),
    [routes]
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle._id,
        label: `${vehicle.busNumber} (${vehicle.vehicleType})`,
      })),
    [vehicles]
  );

  const dataSource = useMemo(
    () =>
      assignments.map((assignment) => ({
        key: assignment._id,
        _id: assignment._id,
        studentEnrollmentId: assignment.studentEnrollmentId?._id,
        studentName: assignment.studentEnrollmentId?.studentId?.userId?.name || "-",
        registrationNumber: assignment.studentEnrollmentId?.registrationNumber || "-",
        className: assignment.studentEnrollmentId?.schoolClassId?.className || "-",
        sectionName: assignment.studentEnrollmentId?.sectionId?.name || "-",
        routeName: assignment.routeId?.name || "-",
        vehicleNumber: assignment.vehicleId?.busNumber || "-",
        pickupStop: assignment.pickupStop || "-",
        dropStop: assignment.dropStop || "-",
        isActive: assignment.isActive,
      })),
    [assignments]
  );

  const handleSaveAssignment = async (values) => {
    try {
      await dispatch(
        saveAssignment({
          studentEnrollmentId: values.studentEnrollmentId,
          routeId: values.routeId,
          vehicleId: values.vehicleId,
          pickupStop: values.pickupStop,
          dropStop: values.dropStop,
        })
      ).unwrap();

      message.success(editingAssignment ? "Assignment updated successfully" : "Assignment created successfully");
      setModalVisible(false);
      setEditingAssignment(null);
      form.resetFields();
      dispatch(fetchAssignments());
    } catch (error) {
      message.error(error || "Unable to save assignment");
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      studentEnrollmentId: assignment.studentEnrollmentId,
      routeId: routes.find((route) => route.name === assignment.routeName)?._id,
      vehicleId: vehicles.find((vehicle) => vehicle.busNumber === assignment.vehicleNumber)?._id,
      pickupStop: assignment.pickupStop === "-" ? "" : assignment.pickupStop,
      dropStop: assignment.dropStop === "-" ? "" : assignment.dropStop,
    });
    setModalVisible(true);
  };

  const handleDeleteAssignment = (assignment) => {
    Modal.confirm({
      title: "Remove assignment?",
      content: `This will remove transport assignment for ${assignment.studentName}.`,
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          await dispatch(deleteAssignment(assignment._id)).unwrap();
          message.success("Assignment removed successfully");
        } catch (error) {
          message.error(error || "Unable to delete assignment");
        }
      },
    });
  };

  const columns = [
    { title: "Student", dataIndex: "studentName", key: "studentName" },
    { title: "Reg No.", dataIndex: "registrationNumber", key: "registrationNumber" },
    {
      title: "Class",
      key: "classSection",
      render: (_, record) => `${record.className} ${record.sectionName}`,
    },
    { title: "Route", dataIndex: "routeName", key: "routeName" },
    { title: "Vehicle", dataIndex: "vehicleNumber", key: "vehicleNumber" },
    { title: "Pickup", dataIndex: "pickupStop", key: "pickupStop" },
    { title: "Drop", dataIndex: "dropStop", key: "dropStop" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => <Tag color={isActive ? "green" : "default"}>{isActive ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditAssignment(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAssignment(record)}>
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Transport</Breadcrumb.Item>
        <Breadcrumb.Item>Student Assignments</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Assignments">{assignments.length}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Students Available">{students.length}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Routes Available">{routes.length}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Transport Assignments</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Assign Transport
          </Button>
        </div>

        <Table columns={columns} dataSource={dataSource} loading={loading} pagination={{ pageSize: 8 }} rowKey="key" />

        <Modal
          title={editingAssignment ? "Edit Assignment" : "Assign Transport"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingAssignment(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveAssignment}>
            <Form.Item
              label="Student"
              name="studentEnrollmentId"
              rules={[{ required: true, message: "Please select a student" }]}
            >
              <Select showSearch optionFilterProp="label" options={studentOptions} placeholder="Select student" />
            </Form.Item>

            <Form.Item label="Route" name="routeId" rules={[{ required: true, message: "Please select a route" }]}>
              <Select showSearch optionFilterProp="label" options={routeOptions} placeholder="Select route" />
            </Form.Item>

            <Form.Item
              label="Vehicle"
              name="vehicleId"
              rules={[{ required: true, message: "Please select a vehicle" }]}
            >
              <Select showSearch optionFilterProp="label" options={vehicleOptions} placeholder="Select vehicle" />
            </Form.Item>

            <Form.Item label="Pickup Stop" name="pickupStop">
              <Input placeholder="Enter pickup stop" />
            </Form.Item>

            <Form.Item label="Drop Stop" name="dropStop">
              <Input placeholder="Enter drop stop" />
            </Form.Item>

            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setEditingAssignment(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingAssignment ? "Update" : "Save"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Assignments;

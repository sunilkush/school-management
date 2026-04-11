import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tag,
  Card,
  Row,
  Col,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createVehicle, deleteVehicle, fetchRoutes, fetchVehicles, updateVehicle } from "../../../features/transportSlice";
import { fetchAllUser } from "../../../features/authSlice";

const { Content } = Layout;
const { Option } = Select;

const Vehicles = () => {
  const dispatch = useDispatch();
   const { vehicles, routes, loading } = useSelector((state) => state.transport);
  const { users = [] } = useSelector((state) => state.auth);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
      dispatch(fetchVehicles());
    dispatch(fetchRoutes());
    dispatch(fetchAllUser());
  }, [dispatch]);
  const driverOptions = useMemo(
    () =>
      users
        .filter((user) => user?.role?.name === "Driver")
        .map((user) => ({
          value: user.name,
          label: user.name,
          contact: user.phone || user.mobile || user.contactNumber || user.email || "",
        })),
    [users]
  );

  const routeOptions = useMemo(
    () =>
      routes.map((route) => ({
        value: route.name,
        label: route.name,
      })),
    [routes]
  );
  const dataSource = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        key: vehicle._id,
        _id: vehicle._id,
        type: vehicle.vehicleType,
        number: vehicle.busNumber,
        driver: vehicle.driverName,
        driverContact: vehicle.driverContact,
        drivingLicense: vehicle.drivingLicense,
        capacity: vehicle.capacity,
        status: vehicle.status,
        route: vehicle.route,
      })),
    [vehicles]
  );

  const handleSaveVehicle = async (values) => {
    const payload = {
      type: values.type,
      number: values.number,
      driver: values.driver,
      driverContact: values.driverContact,
      drivingLicense: values.drivingLicense,
      capacity: values.capacity,
      status: values.status,
      route: values.route,
    };

    try {
      if (editingVehicle?._id) {
        await dispatch(updateVehicle({ id: editingVehicle._id, payload })).unwrap();
        message.success("Vehicle updated successfully!");
      } else {
        await dispatch(createVehicle(payload)).unwrap();
        message.success("Vehicle added successfully!");
      }
      setModalVisible(false);
      setEditingVehicle(null);
      form.resetFields();
    } catch (error) {
      message.error(error || "Unable to save vehicle");
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue(vehicle);
    setModalVisible(true);
  };
  const handleDriverChange = (selectedDriver) => {
    const selectedDriverInfo = driverOptions.find((driver) => driver.value === selectedDriver);

    form.setFieldsValue({
      driver: selectedDriver,
      driverContact: selectedDriverInfo?.contact || "",
    });
  };
  const handleDeleteVehicle = (vehicle) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete vehicle ${vehicle.number}?`,
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          await dispatch(deleteVehicle(vehicle._id)).unwrap();
          message.success("Vehicle deleted successfully!");
        } catch (error) {
          message.error(error || "Unable to delete vehicle");
        }
      },
    });
  };

  const totalVehicles = dataSource.length;
  const totalInUse = dataSource.filter((vehicle) => vehicle.status === "In Use").length;
  const totalAvailable = dataSource.filter((vehicle) => vehicle.status === "Available").length;

  const columns = [
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Vehicle Number", dataIndex: "number", key: "number" },
    { title: "Driver", dataIndex: "driver", key: "driver" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={status === "In Use" ? "red" : "green"}>{status}</Tag>,
    },
    { title: "Route Assigned", dataIndex: "route", key: "route" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditVehicle(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteVehicle(record)}>
            Delete
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
        <Breadcrumb.Item>Vehicles</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card title="Total Vehicles">{totalVehicles}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="In Use">{totalInUse}</Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card title="Available">{totalAvailable}</Card>
          </Col>
        </Row>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>School Vehicles</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Add Vehicle
          </Button>
        </div>

        <Table columns={columns} dataSource={dataSource} loading={loading} pagination={{ pageSize: 5 }} rowKey="key" />

        <Modal
          title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingVehicle(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveVehicle}>
            <Form.Item label="Type" name="type" rules={[{ required: true, message: "Enter vehicle type" }]}>
              <Select placeholder="Select vehicle type">
                <Option value="Bus">Bus</Option>
                <Option value="Van">Van</Option>
                <Option value="Car">Car</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Vehicle Number" name="number" rules={[{ required: true, message: "Enter vehicle number" }]}>
              <Input placeholder="Enter vehicle number" />
            </Form.Item>
           <Form.Item label="Driver Name" name="driver" rules={[{ required: true, message: "Select driver" }]}>
              <Select
                placeholder="Select driver"
                showSearch
                optionFilterProp="label"
                options={driverOptions}
                onChange={handleDriverChange}
              />
            </Form.Item>
            <Form.Item label="Driver Contact" name="driverContact">
               <Input placeholder="Auto-fetched from driver profile" readOnly />
            </Form.Item>
            <Form.Item label="Driving License" name="drivingLicense">
              <Input placeholder="Enter driving license" />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: "Enter capacity" }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true, message: "Select status" }]}>
              <Select placeholder="Select status">
                <Option value="In Use">In Use</Option>
                <Option value="Available">Available</Option>
                <Option value="Maintenance">Maintenance</Option>
              </Select>
            </Form.Item>
             <Form.Item label="Route Assigned" name="route">
              <Select
                placeholder="Select route"
                allowClear
                showSearch
                optionFilterProp="label"
                options={routeOptions}
              />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    setEditingVehicle(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingVehicle ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Vehicles;
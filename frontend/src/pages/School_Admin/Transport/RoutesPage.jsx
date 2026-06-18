import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createRoute, deleteRoute, fetchRoutes, updateRoute } from "../../../features/transportSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  statGrid,
  statCard,
  statLabel,
  statValue,
  tableHeadCss,
  toolbarRow,
} from "../../../styles/pageStyles";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const { routes, loading } = useSelector((state) => state.transport);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchRoutes());
  }, [dispatch]);

  const dataSource = useMemo(
    () =>
      routes.map((route) => ({
        key: route._id,
        _id: route._id,
        name: route.name,
        bus: route.bus,
        stops: route.stops || [],
        students: route.students || 0,
      })),
    [routes]
  );

  const handleSaveRoute = async (values) => {
    const payload = {
      name: values.name,
      bus: values.bus,
      stops: values.stops
        .split(",")
        .map((stop) => stop.trim())
        .filter(Boolean),
      students: values.students,
    };

    try {
      if (editingRoute?._id) {
        await dispatch(updateRoute({ id: editingRoute._id, payload })).unwrap();
        message.success("Route updated successfully!");
      } else {
        await dispatch(createRoute(payload)).unwrap();
        message.success("Route added successfully!");
      }
      setModalVisible(false);
      setEditingRoute(null);
      form.resetFields();
    } catch (error) {
      message.error(error || "Unable to save route");
    }
  };

  const handleEditRoute = (route) => {
    setEditingRoute(route);
    form.setFieldsValue({
      name: route.name,
      bus: route.bus,
      stops: route.stops.join(", "),
      students: route.students,
    });
    setModalVisible(true);
  };

  const handleDeleteRoute = (route) => {
    Modal.confirm({
      title: "Are you sure?",
      content: `Do you want to delete ${route.name}?`,
      okText: "Yes",
      cancelText: "No",
      centered: true,
      onOk: async () => {
        try {
          await dispatch(deleteRoute(route._id)).unwrap();
          message.success("Route deleted successfully!");
        } catch (error) {
          message.error(error || "Unable to delete route");
        }
      },
    });
  };

  const totalRoutes = dataSource.length;
  const totalBuses = new Set(dataSource.map((route) => route.bus)).size;
  const totalStudents = dataSource.reduce((acc, route) => acc + route.students, 0);

  const columns = [
    { title: "Route Name", dataIndex: "name", key: "name" },
    { title: "Bus Assigned", dataIndex: "bus", key: "bus" },
    { title: "Stops", dataIndex: "stops", key: "stops", render: (stops) => stops.join(", ") },
    { title: "Students", dataIndex: "students", key: "students" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditRoute(record)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoute(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("routes-tbl")}</style>
      <PageHeader
        title="Bus Routes"
        subtitle="Manage transport routes, stops and bus assignments"
        icon={<CarOutlined />}
      />

      <div style={{ padding: "20px" }}>
        <div className="stat-grid" style={statGrid(160)}>
          <div style={statCard({ color: "var(--primary)" })}>
            <div>
              <div style={statLabel("var(--primary)")}>Total Routes</div>
              <div style={statValue("var(--primary)")}>{totalRoutes}</div>
            </div>
          </div>
          <div style={statCard({ color: "#5BA89A" })}>
            <div>
              <div style={statLabel("#5BA89A")}>Total Buses</div>
              <div style={statValue("#5BA89A")}>{totalBuses}</div>
            </div>
          </div>
          <div style={statCard({ color: "#D4922A" })}>
            <div>
              <div style={statLabel("#D4922A")}>Total Students</div>
              <div style={statValue("#D4922A")}>{totalStudents}</div>
            </div>
          </div>
        </div>

        <div className="page-toolbar" style={toolbarRow}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Bus Routes</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Add Route
          </Button>
        </div>

        <div style={pageCard}>
          <Table
            className="routes-tbl"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={{ pageSize: 5 }}
            rowKey="key"
            scroll={{ x: "max-content" }}
          />
        </div>

        <Modal
          title={editingRoute ? "Edit Route" : "Add Route"}
          open={modalVisible}
          centered
          onCancel={() => {
            setModalVisible(false);
            setEditingRoute(null);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveRoute}>
            <Form.Item label="Route Name" name="name" rules={[{ required: true, message: "Enter route name" }]}>
              <Input placeholder="Enter route name" />
            </Form.Item>
            <Form.Item label="Bus Assigned" name="bus" rules={[{ required: true, message: "Enter bus name" }]}>
              <Input placeholder="Enter bus name" />
            </Form.Item>
            <Form.Item label="Stops (comma separated)" name="stops" rules={[{ required: true, message: "Enter stops" }]}>
              <Input placeholder="e.g., Stop 1, Stop 2, Stop 3" />
            </Form.Item>
            <Form.Item
              label="Number of Students"
              name="students"
              rules={[{ required: true, message: "Enter number of students" }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingRoute(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingRoute ? "Update" : "Add"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default RoutesPage;

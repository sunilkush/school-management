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
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createRoute, deleteRoute, fetchRoutes, updateRoute } from "../../../features/transportSlice";
import PageHeader from "../../../components/layout/PageHeader";
import RouteStopMapper from "../../../components/transport/RouteStopMapper";
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

const TRANSPORT_MANAGE_ROLES = ["Super Admin", "School Admin", "Transport Manager"];

const RoutesPage = () => {
  const dispatch = useDispatch();
  const { routes, loading } = useSelector((state) => state.transport);
  const { user } = useSelector((state) => state.auth);
  const canManageRoutes = TRANSPORT_MANAGE_ROLES.includes(user?.role?.name);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form] = Form.useForm();
  const [mappingRoute, setMappingRoute] = useState(null);
  const [savingStops, setSavingStops] = useState(false);

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
        stopPoints: route.stopPoints || [],
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
  /** Saves the mapped stops. The plain `stops` name list is derived from these on the server, so
   *  the two lists cannot end up describing different stops. */
  const handleSaveStops = async (stopPoints) => {
    setSavingStops(true);
    try {
      await dispatch(updateRoute({ id: mappingRoute._id, payload: { stopPoints } })).unwrap();
      message.success("Stops mapped — live tracking can now detect arrivals on this route");
      setMappingRoute(null);
    } catch (error) {
      message.error(error || "Unable to save the stops");
    } finally {
      setSavingStops(false);
    }
  };

  const totalBuses = new Set(dataSource.map((route) => route.bus)).size;
  const totalStudents = dataSource.reduce((acc, route) => acc + route.students, 0);

  const columns = [
    { title: "Route Name", dataIndex: "name", key: "name" },
    { title: "Bus Assigned", dataIndex: "bus", key: "bus" },
    { title: "Stops", dataIndex: "stops", key: "stops", render: (stops) => stops.join(", ") },
    {
      title: "On map",
      key: "mapped",
      width: 110,
      // Called out per route because an unmapped route tracks the bus but never fires an arrival,
      // and that difference is invisible until a parent asks why they got no message.
      render: (_, record) =>
        record.stopPoints?.length ? (
          <span style={{ color: "var(--success)", fontWeight: 600 }}>{record.stopPoints.length} mapped</span>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>not mapped</span>
        ),
    },
    { title: "Students", dataIndex: "students", key: "students" },
    ...(canManageRoutes
      ? [{
          title: "Actions",
          key: "actions",
          render: (_, record) => (
            <Space>
              <Button icon={<EnvironmentOutlined />} onClick={() => setMappingRoute(record)}>
                Map stops
              </Button>
              <Button icon={<EditOutlined />} onClick={() => handleEditRoute(record)}>
                Edit
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteRoute(record)}>
                Delete
              </Button>
            </Space>
          ),
        }]
      : []),
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
          <div style={statCard({ color: "var(--success)" })}>
            <div>
              <div style={statLabel("var(--success)")}>Total Buses</div>
              <div style={statValue("var(--success)")}>{totalBuses}</div>
            </div>
          </div>
          <div style={statCard({ color: "var(--warning)" })}>
            <div>
              <div style={statLabel("var(--warning)")}>Total Students</div>
              <div style={statValue("var(--warning)")}>{totalStudents}</div>
            </div>
          </div>
        </div>

        <div className="page-toolbar" style={toolbarRow}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Bus Routes</div>
          {canManageRoutes && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Add Route
            </Button>
          )}
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

        <RouteStopMapper
          open={!!mappingRoute}
          route={mappingRoute}
          saving={savingStops}
          onClose={() => setMappingRoute(null)}
          onSave={handleSaveStops}
        />
      </div>
    </div>
  );
};

export default RoutesPage;

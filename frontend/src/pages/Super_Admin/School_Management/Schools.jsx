import React, { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools, deleteSchool } from "../../../features/schoolSlice";
import AddSchoolForm from "../../../components/forms/AddSchoolForm";
import {
  Button,
  Modal,
  Spin,
  Row,
  Col,
  Card,
  Tag,
  Empty,
  Popconfirm,
  message,
  Typography,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import schoolImg from "../../../assets/school.png";

const { Title, Text } = Typography;

// ✅ Extracted outside — pure presentational, no hook deps
const SchoolCard = ({ school, onDelete }) => (
  <Card
    hoverable
    style={{
      height: "100%",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      position: "relative",
    }}
    bodyStyle={{
      padding: 16,
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
  >
    {/* HEADER */}
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <Space>
        <BankOutlined style={{ color: "#2563eb", fontSize: 18 }} />
        <Text strong style={{ textTransform: "uppercase", color: "#1e3a8a" }}>
          {school.name}
        </Text>
      </Space>

      <Popconfirm
        title="Delete this school?"
        description="This action cannot be undone."  // ✅ Added description for clarity
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        onConfirm={() => onDelete(school._id)}
      >
        <DeleteOutlined
          style={{ color: "#9ca3af", cursor: "pointer", fontSize: 16 }}
          aria-label="Delete school"
        />
      </Popconfirm>
    </Space>

    {/* ADDRESS */}
    <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
      {school.address || "—"}  {/* ✅ Graceful fallback if address is missing */}
    </Text>

    {/* BOARDS */}
    <div style={{ marginTop: 12 }}>
      <Text strong style={{ fontSize: 12 }}>Boards:</Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
        {school.boards?.length ? (
          school.boards.map((board) => (
            <Tag color="blue" key={board._id}>{board.name}</Tag>
          ))
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>None</Text>  // ✅ Empty board fallback
        )}
      </div>
    </div>

    {/* SUBSCRIPTION */}
    {school.subscriptionPlan && (
      <div style={{ marginTop: 12 }}>
        <Text strong style={{ fontSize: 12 }}>Plan:</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
          <Tag color="purple">{school.subscriptionPlan.name}</Tag>
          <Tag color="gold">₹{school.subscriptionPlan.price}</Tag>
          <Tag color="geekblue">{school.subscriptionPlan.durationInDays} days</Tag>
        </div>
      </div>
    )}

    {/* FOOTER */}
    <div style={{ marginTop: "auto", paddingTop: 12 }}>
      <Space size="small">
        <Text>Status:</Text>
        <Tag color={school.isActive ? "green" : "red"}>
          {school.isActive ? "Active" : "Inactive"}
        </Tag>
      </Space>

      <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
        {/* ✅ Locale-aware date formatting */}
        Created on{" "}
        {school.createdAt
          ? new Date(school.createdAt).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </Text>
    </div>

    {/* DECORATIVE ICON */}
    <img
      src={schoolImg}
      alt=""                          // ✅ Decorative image — empty alt so screen readers skip it
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        width: 40,
        opacity: 0.7,
      }}
    />
  </Card>
);

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch on mount
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ Stable delete handler with correct message.error signature
  const handleDeleteSchool = useCallback(
    async (id) => {
      try {
        await dispatch(deleteSchool(id)).unwrap();
        message.success("School deleted successfully");
        dispatch(fetchSchools()); // ✅ Refresh list after delete
      } catch (err) {
        // 🐛 Bug fix: message.error(err, "...") is wrong — first arg is the message string
        message.error(typeof err === "string" ? err : "Failed to delete school");
      }
    },
    [dispatch]
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px 16px" }}>

      {/* ===== HEADER ===== */}
      <Space
        style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
        align="center"
      >
        <div>
          <Title level={3} style={{ marginBottom: 0, color: "#1e3a8a" }}>
            Schools Management
          </Title>
          <Text type="secondary">Manage all registered schools</Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openModal}
        >
          Add School
        </Button>
      </Space>

      {/* ===== CONTENT ===== */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "96px 0" }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Text type="danger" style={{ display: "block", textAlign: "center" }}>
          {typeof error === "string" ? error : "Something went wrong"}  {/* ✅ Guard against non-string errors */}
        </Text>
      ) : !schools?.length ? (
        <Empty description="No schools found" />
      ) : (
        <Row gutter={[16, 16]}>
          {schools.map((school) => (
            <Col key={school._id} xs={24} sm={12} lg={8}>
              <SchoolCard school={school} onDelete={handleDeleteSchool} />
            </Col>
          ))}
        </Row>
      )}

      {/* ===== ADD SCHOOL MODAL ===== */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        width={600}
        destroyOnClose  // ✅ Resets AddSchoolForm state when modal closes
        title={<Title level={4} style={{ marginBottom: 0 }}>Add New School</Title>}
      >
        <AddSchoolForm onClose={closeModal} />
      </Modal>
    </div>
  );
};

export default Schools;
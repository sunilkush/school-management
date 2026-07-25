import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin, Empty, Tag, Descriptions, List, Avatar } from "antd";
import {
  HomeOutlined, UserOutlined,
  TeamOutlined, BankOutlined,
} from "@ant-design/icons";
import { fetchStudentHostel } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell } from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    ...sectionPanel, display: "flex", alignItems: "center",
    gap: 14, padding: "16px 20px", marginBottom: 0,
  }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{value || "—"}</div>
    </div>
  </div>
);

const StudentHostel = () => {
  const dispatch  = useDispatch();
  const { hostel, hostelLoading } = useSelector((s) => s.studentPortal || {});
  const allocation = hostel || null;

  useEffect(() => { dispatch(fetchStudentHostel()); }, [dispatch]);

  if (hostelLoading) return (
    <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", padding: 80 }}>
      <Spin size="large" />
    </div>
  );

  if (!allocation) return (
    <div style={pageWrapper}>
      <PageHeader title="Hostel" subtitle="Your hostel room allocation" icon={<HomeOutlined />} />
      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: "var(--text-muted)" }}>No hostel allocation found. Contact the hostel office.</span>} />
      </div>
    </div>
  );

  return (
    <div style={pageWrapper}>
      <PageHeader title="Hostel" subtitle="Your hostel room details and allocation" icon={<HomeOutlined />} />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<BankOutlined />}    label="Room Number"  value={allocation.roomNumber}  color="#14B8A6" />
        <StatCard icon={<TeamOutlined />}    label="Capacity"     value={allocation.capacity}    color="#22C55E" />
        <StatCard icon={<UserOutlined />}    label="Status"       value={allocation.status === "occupied" ? "Occupied" : "Vacant"} color="#F59E0B" />
        <StatCard icon={<HomeOutlined />}    label="Academic Year" value={allocation.academicYear?.name || "N/A"} color="#0891b2" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 0 }}>
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Room Details</div>
          <Descriptions column={1} size="small" labelStyle={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>
            <Descriptions.Item label="Room Number">{allocation.roomNumber || "—"}</Descriptions.Item>
            <Descriptions.Item label="Capacity">{allocation.capacity || "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={allocation.status === "occupied" ? "green" : "default"}>
                {allocation.status === "occupied" ? "Occupied" : "Vacant"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Academic Year">{allocation.academicYear?.name || "—"}</Descriptions.Item>
          </Descriptions>
        </div>

        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Roommates</div>
          {allocation.roommates?.length ? (
            <List
              size="small"
              dataSource={allocation.roommates}
              renderItem={(name) => (
                <List.Item>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar size={30} icon={<UserOutlined />} style={{ background: "var(--primary)" }} />
                    <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{name}</span>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No roommates assigned to this room.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHostel;

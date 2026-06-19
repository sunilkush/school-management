import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Spin, Empty, Tag, Descriptions, Avatar } from "antd";
import {
  HomeOutlined, UserOutlined, PhoneOutlined,
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
        <StatCard icon={<HomeOutlined />}    label="Block / Floor" value={allocation.block || allocation.floor || "N/A"} color="#0891b2" />
        <StatCard icon={<TeamOutlined />}    label="Capacity"     value={allocation.capacity}    color="#22C55E" />
        <StatCard icon={<UserOutlined />}    label="Status"       value={allocation.status === "occupied" ? "Occupied" : "Vacant"} color="#F59E0B" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 0 }}>
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Room Details</div>
          <Descriptions column={1} size="small" labelStyle={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 12 }}>
            <Descriptions.Item label="Room Number">{allocation.roomNumber || "—"}</Descriptions.Item>
            <Descriptions.Item label="Floor">{allocation.floor || "—"}</Descriptions.Item>
            <Descriptions.Item label="Block">{allocation.block || "—"}</Descriptions.Item>
            <Descriptions.Item label="Type">{allocation.roomType || "Standard"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={allocation.status === "occupied" ? "green" : "default"}>
                {allocation.status === "occupied" ? "Occupied" : "Vacant"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Academic Year">{allocation.academicYearId?.name || "—"}</Descriptions.Item>
          </Descriptions>
        </div>

        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Hostel Warden</div>
          {allocation.wardenName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar size={48} icon={<UserOutlined />} style={{ background: "var(--primary)" }} />
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{allocation.wardenName}</div>
                {allocation.wardenPhone && (
                  <a href={`tel:${allocation.wardenPhone}`} style={{ color: "var(--primary)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                    <PhoneOutlined /> {allocation.wardenPhone}
                  </a>
                )}
                {allocation.wardenEmail && (
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{allocation.wardenEmail}</div>
                )}
              </div>
            </div>
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Warden details not available.</span>
          )}
        </div>
      </div>

      {Array.isArray(allocation.rules) && allocation.rules.length > 0 && (
        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>Hostel Rules</div>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {allocation.rules.map((rule, i) => (
              <li key={i} style={{ color: "var(--text-primary)", fontSize: 13, marginBottom: 6 }}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentHostel;

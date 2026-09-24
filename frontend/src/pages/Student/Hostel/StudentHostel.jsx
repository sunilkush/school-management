import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin, Empty, Tag, Descriptions, List, Avatar } from "antd";
import {
  HomeOutlined, UserOutlined,
  TeamOutlined, BankOutlined,
} from "@ant-design/icons";
import { fetchStudentHostel } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell } from "../../../styles/pageStyles";

const StatCard = ({ icon, label, value, color }) => (
  <div className="section-panel is-header-strip">
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
    <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <Spin size="large" />
    </div>
  );

  if (!allocation) return (
    <div className="page-wrapper">
      <PageHeader title="Hostel" subtitle="Your hostel room allocation" icon={<HomeOutlined />} />
      <div className="section-panel u-mt-5">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="u-muted">No hostel allocation found. Contact the hostel office.</span>} />
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader title="Hostel" subtitle="Your hostel room details and allocation" icon={<HomeOutlined />} />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<BankOutlined />}    label="Room Number"  value={allocation.roomNumber}  color="var(--accent)" />
        <StatCard icon={<TeamOutlined />}    label="Capacity"     value={allocation.capacity}    color="var(--success)" />
        <StatCard icon={<UserOutlined />}    label="Status"       value={allocation.status === "occupied" ? "Occupied" : "Vacant"} color="var(--warning)" />
        <StatCard icon={<HomeOutlined />}    label="Academic Year" value={allocation.academicYear?.name || "N/A"} color="var(--cyan)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 0 }}>
        <div className="section-panel">
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

        <div className="section-panel">
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Roommates</div>
          {allocation.roommates?.length ? (
            <List
              size="small"
              dataSource={allocation.roommates}
              renderItem={(name) => (
                <List.Item>
                  <div className="u-row">
                    <Avatar size={30} icon={<UserOutlined />} style={{ background: "var(--primary)" }} />
                    <span style={{ color: "var(--text-primary)", fontSize: 13 }}>{name}</span>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <span className="u-meta-md">No roommates assigned to this room.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHostel;

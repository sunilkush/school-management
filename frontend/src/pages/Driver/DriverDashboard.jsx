import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Empty, Space, Spin } from "antd";
import {
  CarOutlined, ClockCircleOutlined, DashboardOutlined,
  EnvironmentOutlined, IdcardOutlined, TeamOutlined, UnorderedListOutlined, WalletOutlined,
} from "@ant-design/icons";
import { fetchMyVehicles } from "../../features/transportSlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell, pill } from "../../styles/pageStyles";

const STATUS_COLOR = {
  Available: ["var(--success-hover)", "rgba(var(--success-rgb), 0.5)"],
  "In Use": ["var(--warning-hover)", "rgba(var(--warning-rgb), 0.5)"],
  Maintenance: ["var(--text-secondary)", "var(--border-muted)"],
};

const VehicleCard = ({ vehicle }) => {
  const [color, bg] = STATUS_COLOR[vehicle.status] || STATUS_COLOR.Available;
  return (
    <div style={{ ...sectionPanel, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={iconWell("var(--primary)", 48)}><CarOutlined style={{ fontSize: 20 }} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{vehicle.busNumber}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{vehicle.vehicleType} · {vehicle.capacity || 0} seats</div>
          </div>
        </div>
        <span style={pill(color, bg)}>{vehicle.status}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EnvironmentOutlined style={{ color: "var(--text-muted)" }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Route</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{vehicle.route || "Not assigned"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IdcardOutlined style={{ color: "var(--text-muted)" }} />
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Driving License</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{vehicle.drivingLicense || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const { myVehicles = [], myVehiclesLoading } = useSelector((state) => state.transport || {});

  useEffect(() => { dispatch(fetchMyVehicles()); }, [dispatch]);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Driver Dashboard"
        subtitle={`Welcome back, ${user?.name || "Driver"}`}
        icon={<DashboardOutlined />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 20 }} className="driver-dash-grid">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>My Vehicle</div>
          <Spin spinning={myVehiclesLoading}>
            {myVehicles.length === 0 ? (
              <div style={sectionPanel}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No vehicle linked to your account yet — ask your Transport Manager to link one from the Vehicles page."
                />
              </div>
            ) : (
              myVehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)
            )}
          </Spin>
        </div>

        <div style={sectionPanel}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Quick Actions</div>
          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            <Button block icon={<CarOutlined />} onClick={() => navigate("/dashboard/driver/attendance/self")}>
              GPS Check-In / Check-Out
            </Button>
            <Button block icon={<ClockCircleOutlined />} onClick={() => navigate("/dashboard/driver/attendance/my")}>
              My Attendance
            </Button>
            <Button block icon={<TeamOutlined />} onClick={() => navigate("/dashboard/driver/leave")}>
              Apply Leave
            </Button>
            <Button block icon={<WalletOutlined />} onClick={() => navigate("/dashboard/driver/payroll")}>
              My Payroll
            </Button>
            <Button block icon={<UnorderedListOutlined />} onClick={() => navigate("/dashboard/driver/tasks")}>
              My Tasks
            </Button>
          </Space>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .driver-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default DriverDashboard;

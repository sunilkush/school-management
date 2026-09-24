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
import { iconWell, pill } from "../../styles/pageStyles";
import MyAttendanceSection from "../../components/attendance/MyAttendanceSection";

const STATUS_COLOR = {
  Available: ["var(--success-hover)", "rgba(var(--success-rgb), 0.5)"],
  "In Use": ["var(--warning-hover)", "rgba(var(--warning-rgb), 0.5)"],
  Maintenance: ["var(--text-secondary)", "var(--border-muted)"],
};

const VehicleCard = ({ vehicle }) => {
  const [color, bg] = STATUS_COLOR[vehicle.status] || STATUS_COLOR.Available;
  return (
    <div className="section-panel u-mb-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={iconWell("var(--primary)", 48)}><CarOutlined style={{ fontSize: 20 }} /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{vehicle.busNumber}</div>
            <div className="u-meta">{vehicle.vehicleType} · {vehicle.capacity || 0} seats</div>
          </div>
        </div>
        <span style={pill(color, bg)}>{vehicle.status}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 18 }}>
        <div className="u-row">
          <EnvironmentOutlined className="u-muted" />
          <div>
            <div className="u-meta-xs">Route</div>
            <div className="u-label">{vehicle.route || "Not assigned"}</div>
          </div>
        </div>
        <div className="u-row">
          <IdcardOutlined className="u-muted" />
          <div>
            <div className="u-meta-xs">Driving License</div>
            <div className="u-label">{vehicle.drivingLicense || "—"}</div>
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
    <div className="page-wrapper">
      <PageHeader
        title="Driver Dashboard"
        subtitle={`Welcome back, ${user?.name || "Driver"}`}
        icon={<DashboardOutlined />}
      />
      <MyAttendanceSection />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 20 }} className="driver-dash-grid">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>My Vehicle</div>
          <Spin spinning={myVehiclesLoading}>
            {myVehicles.length === 0 ? (
              <div className="section-panel">
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

        <div className="section-panel">
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>Quick Actions</div>
          <Space direction="vertical" className="u-full" size={8}>
            <Button block icon={<CarOutlined />} onClick={() => navigate("/dashboard/driver/attendance/self")}>
              My Attendance
            </Button>
            <Button block icon={<ClockCircleOutlined />} onClick={() => navigate("/dashboard/driver/attendance/my")}>
              My Attendance History
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

          </div>
  );
};

export default DriverDashboard;

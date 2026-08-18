import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Avatar, Empty, Spin, Tag } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CarOutlined,
  NodeIndexOutlined,
  IdcardOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { fetchStudentTransport } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell } from "../../../styles/pageStyles";

/* ── helpers ── */
const statusColor = {
  "In Use":      { bg: "var(--success-light)", color: "var(--success-hover)", dot: "var(--success)" },
  "Available":   { bg: "var(--primary-light)", color: "var(--primary-hover)", dot: "var(--info)" },
  "Maintenance": { bg: "var(--warning-light)", color: "var(--warning-hover)", dot: "var(--warning)" },
};

const InfoRow = ({ icon, label, value, mono = false }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "9px 0", borderBottom: "1px solid var(--border-muted)",
  }}>
    <span style={{ color: "var(--primary)", fontSize: 15, marginTop: 2, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: mono ? "monospace" : undefined }}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color, tag }) => (
  <div style={{
    background: "var(--surface)", border: "1px solid var(--border-muted)",
    borderRadius: 14, padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 13,
  }}>
    <div style={iconWell(color, 44)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
      {tag ? tag : (
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, wordBreak: "break-word" }}>
          {value || "—"}
        </div>
      )}
    </div>
  </div>
);

const StudentTransport = () => {
  const dispatch = useDispatch();
  const { transportAssignment, loading, error } = useSelector((s) => s.studentPortal);

  useEffect(() => { dispatch(fetchStudentTransport()); }, [dispatch]);

  if (loading) return (
    <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
      <Spin size="large" />
    </div>
  );

  const t     = transportAssignment;
  const route = t?.routeId  || {};
  const veh   = t?.vehicleId || {};
  const status = veh?.status || "Available";
  const sc     = statusColor[status] || statusColor["Available"];
  const stops  = Array.isArray(route?.stops) ? route.stops : [];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Transport"
        subtitle="Your bus route, vehicle and stop details"
        icon={<CarOutlined />}
      />

      {error && (
        <Alert
          type="error"
          message="Failed to load transport details"
          description={typeof error === "string" ? error : "Please try again or contact the transport office."}
          showIcon
          style={{ marginTop: 16, borderRadius: 12 }}
          closable
        />
      )}

      {!t ? (
        <div style={{ ...sectionPanel, marginTop: 20, textAlign: "center", padding: "48px 24px" }}>
          <CarOutlined style={{ fontSize: 48, color: "var(--text-muted)", marginBottom: 14 }} />
          <Empty
            image={null}
            description={
              <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                No transport has been assigned to you yet.<br />
                <span style={{ fontSize: 12, marginTop: 4, display: "block" }}>Contact the transport office for assistance.</span>
              </span>
            }
          />
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div style={{ ...statGrid(160), marginTop: 20 }}>
            <StatCard
              icon={<ApartmentOutlined />}
              label="Route"
              value={t.routeName || route?.name}
              color="var(--purple)"
            />
            <StatCard
              icon={<CarOutlined />}
              label="Vehicle No."
              value={t.vehicleNumber || veh?.busNumber}
              color="var(--cyan)"
            />
            <StatCard
              icon={<UserOutlined />}
              label="Driver"
              value={veh?.driverName}
              color="var(--success-hover)"
            />
            <StatCard
              icon={<NodeIndexOutlined />}
              label="Status"
              color={sc.color}
              tag={
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: sc.bg, color: sc.color,
                  padding: "3px 12px", borderRadius: 99,
                  fontWeight: 700, fontSize: 13,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot }} />
                  {status}
                </span>
              }
            />
          </div>

          {/* ── Details grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 0 }}>

            {/* Vehicle Details */}
            <div style={{ ...sectionPanel }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={iconWell("var(--cyan)", 36)}><CarOutlined /></div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Vehicle Details</div>
              </div>
              <div>
                <InfoRow icon={<CarOutlined />}     label="Bus / Vehicle No."  value={veh?.busNumber}       mono />
                <InfoRow icon={<CarOutlined />}     label="Vehicle Type"       value={veh?.vehicleType || "Bus"} />
                <InfoRow icon={<NodeIndexOutlined />} label="Capacity"         value={veh?.capacity ? `${veh.capacity} seats` : undefined} />
                <InfoRow icon={<IdcardOutlined />}  label="Driving License"    value={veh?.drivingLicense}  mono />
                <div style={{ paddingTop: 9, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "var(--primary)", fontSize: 15, marginTop: 2 }}><NodeIndexOutlined /></span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Vehicle Status</div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: sc.bg, color: sc.color,
                      padding: "2px 10px", borderRadius: 99,
                      fontWeight: 700, fontSize: 12,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div style={{ ...sectionPanel }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={iconWell("var(--success-hover)", 36)}><UserOutlined /></div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Driver Information</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "12px 14px", background: "var(--surface-soft, var(--surface-page))", borderRadius: 12 }}>
                <Avatar size={52} icon={<UserOutlined />} style={{ background: "var(--primary)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{veh?.driverName || "—"}</div>
                  {veh?.driverContact && veh.driverContact !== "NA" && (
                    <a href={`tel:${veh.driverContact}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--primary)", fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                      <PhoneOutlined /> {veh.driverContact}
                    </a>
                  )}
                </div>
              </div>

              <InfoRow icon={<PhoneOutlined />}    label="Contact"       value={veh?.driverContact !== "NA" ? veh?.driverContact : undefined} mono />
              <InfoRow icon={<IdcardOutlined />}   label="License No."   value={veh?.drivingLicense !== "NA" ? veh?.drivingLicense : undefined} mono />
            </div>
          </div>

          {/* ── Route & Stops ── */}
          <div style={{ ...sectionPanel, marginTop: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={iconWell("var(--purple)", 36)}><ApartmentOutlined /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Route Details</div>
                {(t.routeName || route?.name) && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t.routeName || route?.name}</div>
                )}
              </div>
            </div>

            {/* Pickup / Drop highlight */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{
                background: "var(--success-light)", borderRadius: 12, padding: "12px 14px",
                border: "1px solid var(--success-light)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--success-hover)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Pickup Stop
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <EnvironmentOutlined style={{ color: "var(--success)", fontSize: 15 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--success-hover)" }}>
                    {t.pickupStop || t.stopName || "—"}
                  </span>
                </div>
              </div>
              <div style={{
                background: "var(--danger-light)", borderRadius: 12, padding: "12px 14px",
                border: "1px solid var(--danger-light)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger-hover)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Drop Stop
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <EnvironmentOutlined style={{ color: "var(--danger)", fontSize: 15 }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--danger-hover)" }}>
                    {t.dropStop || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* All stops */}
            {stops.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  All Stops ({stops.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {stops.map((stop, i) => {
                    const isPickup = stop === (t.pickupStop || t.stopName);
                    const isDrop   = stop === t.dropStop;
                    const isFirst  = i === 0;
                    const isLast   = i === stops.length - 1;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Timeline line + dot */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                          {!isFirst && <div style={{ width: 2, height: 14, background: "var(--border-muted)" }} />}
                          <div style={{
                            width: isPickup || isDrop || isFirst || isLast ? 14 : 10,
                            height: isPickup || isDrop || isFirst || isLast ? 14 : 10,
                            borderRadius: "50%",
                            background: isPickup ? "var(--success)" : isDrop ? "var(--danger)" : isFirst || isLast ? "var(--primary)" : "var(--border-muted)",
                            border: `2px solid ${isPickup ? "var(--success-hover)" : isDrop ? "var(--danger-hover)" : isFirst || isLast ? "var(--primary)" : "var(--border-muted)"}`,
                            flexShrink: 0,
                          }} />
                          {!isLast && <div style={{ width: 2, height: 14, background: "var(--border-muted)" }} />}
                        </div>
                        {/* Stop label */}
                        <div style={{
                          padding: "6px 10px",
                          margin: "2px 0",
                          borderRadius: 8,
                          background: isPickup ? "var(--success-light)" : isDrop ? "var(--danger-light)" : "transparent",
                          flex: 1,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: isPickup || isDrop ? 700 : 500,
                            color: isPickup ? "var(--success-hover)" : isDrop ? "var(--danger-hover)" : "var(--text-primary)",
                          }}>
                            {stop}
                          </span>
                          {isPickup && (
                            <Tag color="success" style={{ margin: 0, fontSize: 11 }}>Your Pickup</Tag>
                          )}
                          {isDrop && (
                            <Tag color="error" style={{ margin: 0, fontSize: 11 }}>Your Drop</Tag>
                          )}
                          {isFirst && !isPickup && !isDrop && (
                            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>Start</Tag>
                          )}
                          {isLast && !isPickup && !isDrop && (
                            <Tag color="default" style={{ margin: 0, fontSize: 11 }}>End</Tag>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentTransport;

import React, { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Form, InputNumber, Input, Spin, message, Divider, Tag, TimePicker, Switch,
} from "antd";
import {
  AimOutlined, CheckCircleOutlined, EnvironmentOutlined,
  ReloadOutlined, SaveOutlined, TeamOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGeofenceSettings, updateGeofenceSettings, fetchLiveDashboard,
} from "../../../features/attendanceSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper } from "../../../styles/pageStyles";

const C = {
  primary: "#2563EB", primaryLight: "#DBEAFE", primaryLighter: "#EFF6FF",
  accent: "#14B8A6", accentLight: "#CCFBF1",
  success: "#22C55E", successLight: "#DCFCE7",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  danger: "#EF4444",
  border: "#E2E8F0", text: "#0F172A", textSub: "#64748B", textMuted: "#94A3B8",
  surface: "#FFFFFF", surfaceSoft: "#F8FAFC",
};

const PANEL = {
  background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`,
  padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 16,
};

const STATUS_COLOR = {
  present: { bg: C.successLight, color: C.success, border: "#86EFAC" },
  absent:  { bg: "#FEE2E2",      color: C.danger,  border: "#FCA5A5" },
  late:    { bg: C.warningLight, color: C.warning, border: "#FCD34D" },
};

const GeofenceSettings = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { geofenceSettings, liveDashboard } = useSelector((s) => s.attendance);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dashLoading, setDashLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    try { await dispatch(fetchLiveDashboard()).unwrap(); } catch { /* ignore — dashLoading cleared in finally */ }
    finally { setDashLoading(false); }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchGeofenceSettings());
    loadDashboard();
  }, [dispatch, loadDashboard]);

  useEffect(() => {
    if (geofenceSettings?.location) {
      form.setFieldsValue({
        lat: geofenceSettings.location.lat,
        lng: geofenceSettings.location.lng,
        geofenceRadius: geofenceSettings.location.geofenceRadius || 200,
        address: geofenceSettings.location.address || "",
      });
    }
    const hours = geofenceSettings?.attendanceHours;
    if (hours) {
      form.setFieldsValue({
        startTime: hours.startTime ? dayjs(hours.startTime, "HH:mm") : undefined,
        endTime: hours.endTime ? dayjs(hours.endTime, "HH:mm") : undefined,
        autoCheckoutEnabled: hours.autoCheckoutEnabled !== false,
      });
    }
  }, [geofenceSettings, form]);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      message.error("Geolocation not supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setFieldsValue({
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
        message.success("Location detected successfully");
      },
      (err) => {
        setLocating(false);
        message.error(`GPS error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        startTime: values.startTime ? values.startTime.format("HH:mm") : undefined,
        endTime: values.endTime ? values.endTime.format("HH:mm") : undefined,
      };
      await dispatch(updateGeofenceSettings(payload)).unwrap();
      message.success("Geofence settings saved successfully");
    } catch (e) {
      message.error(e || "Failed to save");
    } finally { setSaving(false); }
  };

  const summary = liveDashboard?.summary;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Geofence Settings"
        subtitle="Configure school GPS location and employee check-in geofence radius"
        icon={<EnvironmentOutlined />}
      />

      {/* Live Dashboard Summary */}
      <div style={{ ...PANEL, padding: 16 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 12,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
            Today's Live Attendance
          </div>
          <Button
            size="small" icon={<ReloadOutlined />} onClick={loadDashboard}
            loading={dashLoading}
            style={{ borderRadius: 8, borderColor: C.border, color: C.textSub }}
          >
            Refresh
          </Button>
        </div>

        {summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Total Marked", value: summary.total,      color: C.primary,  bg: C.primaryLighter },
              { label: "Present",      value: summary.present,    color: C.success,  bg: C.successLight },
              { label: "Checked In",   value: summary.checkedIn,  color: C.accent,   bg: C.accentLight },
              { label: "GPS Verified", value: summary.gpsVerified, color: C.warning, bg: C.warningLight },
            ].map((s) => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: 10, padding: "10px 14px",
                border: `1px solid ${C.border}`, textAlign: "center",
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: C.textMuted, padding: 10 }}>
            {dashLoading ? <Spin size="small" /> : "No data yet"}
          </div>
        )}
      </div>

      {/* Geofence Form */}
      <div style={PANEL}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>
          School GPS & Geofence
        </div>
        <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
          Set the school's precise GPS coordinates. Employees must be within the geofence radius to check in/out.
        </div>

        {!geofenceSettings?.location?.lat && (
          <Alert
            type="warning" showIcon style={{ marginBottom: 16, borderRadius: 8 }}
            message="GPS not configured"
            description="Geofence is not set — employees can check in from anywhere. Set coordinates below to enforce geofencing."
          />
        )}

        {geofenceSettings?.location?.lat && (
          <div style={{
            background: C.accentLight, borderRadius: 10, padding: "10px 14px",
            marginBottom: 16, display: "flex", gap: 10, alignItems: "center",
            border: `1px solid #5EEAD4`,
          }}>
            <AimOutlined style={{ color: C.accent, fontSize: 18 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0F766E" }}>
                {geofenceSettings.location.lat.toFixed(6)}, {geofenceSettings.location.lng.toFixed(6)}
              </div>
              <div style={{ fontSize: 12, color: "#0F766E" }}>
                Radius: {geofenceSettings.location.geofenceRadius || 200}m
                {geofenceSettings.location.address && ` · ${geofenceSettings.location.address}`}
              </div>
            </div>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item
              label="Latitude"
              name="lat"
              rules={[{ required: true, message: "Latitude required" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="e.g. 28.613939"
                min={-90} max={90}
                step={0.000001}
                precision={6}
              />
            </Form.Item>

            <Form.Item
              label="Longitude"
              name="lng"
              rules={[{ required: true, message: "Longitude required" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="e.g. 77.209021"
                min={-180} max={180}
                step={0.000001}
                precision={6}
              />
            </Form.Item>
          </div>

          <Button
            onClick={handleAutoDetect}
            loading={locating}
            icon={<AimOutlined />}
            style={{
              marginBottom: 16, borderRadius: 8,
              borderColor: C.accent, color: C.accent, background: C.accentLight,
            }}
          >
            Auto-Detect My Location
          </Button>

          <Form.Item
            label="Geofence Radius (metres)"
            name="geofenceRadius"
            initialValue={200}
            rules={[{ required: true, message: "Radius required" }]}
            extra="Minimum 50m. Recommended: 100–500m for a typical school campus."
          >
            <InputNumber
              style={{ width: "100%" }}
              min={50} max={5000} step={50}
              placeholder="200"
              formatter={(v) => `${v}m`}
              parser={(v) => v.replace("m", "")}
            />
          </Form.Item>

          <Form.Item label="Location Address (optional)" name="address">
            <Input placeholder="e.g. 123 School Road, New Delhi" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Divider style={{ margin: "8px 0 20px" }} />

          <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleOutlined style={{ color: C.primary }} /> Attendance Hours
          </div>
          <div style={{ fontSize: 13, color: C.textSub, marginBottom: 16 }}>
            Students and staff can check in/out themselves any time within school hours. Anyone
            still checked in when school hours end gets automatically checked out.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item label="School Starts" name="startTime">
              <TimePicker format="HH:mm" style={{ width: "100%" }} placeholder="08:00" />
            </Form.Item>
            <Form.Item label="School Ends" name="endTime">
              <TimePicker format="HH:mm" style={{ width: "100%" }} placeholder="15:00" />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Form.Item name="autoCheckoutEnabled" valuePropName="checked" initialValue={true} noStyle>
              <Switch size="small" />
            </Form.Item>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>Auto-checkout at end of school hours</span>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
            When on, anyone who checked in but forgot to check out is auto-checked-out once School Ends passes.
          </div>

          <Button
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
            style={{
              height: 42, paddingLeft: 24, paddingRight: 24,
              background: C.primary, borderColor: C.primary,
              color: "#fff", borderRadius: 10, fontWeight: 700,
            }}
          >
            Save Geofence Settings
          </Button>
        </Form>
      </div>

      {/* Today's Staff Table */}
      {liveDashboard?.records?.length > 0 && (
        <div style={PANEL}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 12 }}>
            Staff Status Today
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.surfaceSoft }}>
                  {["Employee", "Role", "Status", "Check-In", "Check-Out", "GPS"].map((h) => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: C.textSub,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveDashboard.records.map((r) => {
                  const sc = STATUS_COLOR[r.status] || { bg: C.surfaceSoft, color: C.textSub, border: C.border };
                  return (
                    <tr key={r._id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: C.text, fontSize: 13 }}>
                        {r.userId?.name || "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 11, color: C.textSub, background: C.surfaceSoft, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                          {r.role?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Tag style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700 }}>
                          {r.status}
                        </Tag>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                        {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                        {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {r.gpsVerified ? (
                          <CheckCircleOutlined style={{ color: C.success }} />
                        ) : (
                          <span style={{ color: C.textMuted, fontSize: 11 }}>—</span>
                        )}
                        {r.distanceFromSchool != null && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: C.textSub }}>
                            {r.distanceFromSchool}m
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofenceSettings;

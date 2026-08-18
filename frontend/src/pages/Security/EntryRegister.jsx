import React, { useEffect, useMemo, useState } from "react";
import {
  Table, Button, Tag, Space, Typography, Modal, Form, Select,
  Input, Row, Col, App, Empty,
} from "antd";
import {
  AuditOutlined, PlusOutlined, TeamOutlined,
  LoginOutlined, LogoutOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchGateEntries, fetchGateStats, createGateEntry, markGateExit } from "../../features/gateEntrySlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  pageWrapper, statGrid, sectionPanel, iconWell, tableHeadCss, avatarStyle, modalTitle,
} from "../../styles/pageStyles";
import { EntryStatusBadge, getInitials } from "./securityShared";

const { Text } = Typography;

const EntryRegister = () => {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { entries, stats, loading, saving } = useSelector((s) => s.gateEntries);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchGateEntries({ limit: 500 }));
    dispatch(fetchGateStats());
  }, [dispatch]);

  const handleCreate = async (values) => {
    const res = await dispatch(createGateEntry(values));
    if (res.meta.requestStatus === "fulfilled") {
      message.success("Entry logged");
      form.resetFields();
      setOpen(false);
    } else {
      message.error(res.payload || "Failed");
    }
  };

  const handleExit = async (id) => {
    const res = await dispatch(markGateExit(id));
    if (res.meta.requestStatus === "fulfilled") message.success("Exit marked");
    else message.error(res.payload || "Failed");
  };

  const filteredEntries = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.vehicleNo?.toLowerCase().includes(q) ||
        e.gate?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [entries, searchText, typeFilter]);

  const cols = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={avatarStyle(r.name, 34)}>{getInitials(r.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {r.type}{r.purpose ? ` · ${r.purpose}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    { title: "Vehicle No", dataIndex: "vehicleNo", render: (v) => v || "—" },
    { title: "Gate", dataIndex: "gate", render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag> },
    {
      title: "Entry Time", dataIndex: "entryTime",
      render: (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    {
      title: "Exit Time", dataIndex: "exitTime",
      render: (v) => (v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    { title: "Status", dataIndex: "status", render: (v) => <EntryStatusBadge status={v} /> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "Inside" ? (
          <Button size="small" type="primary" ghost icon={<LogoutOutlined />} onClick={() => handleExit(r._id)}>
            Mark Exit
          </Button>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
        ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("entry-tbl")}</style>

      <PageHeader
        title="Entry Register"
        subtitle="Log and track visitor, vendor & staff gate entries"
        icon={<AuditOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ borderRadius: 8 }}>
            New Entry
          </Button>
        }
      />

      {/* ── KPI summary ───────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        {[
          { label: "Currently Inside", value: stats.inside ?? 0,       icon: <TeamOutlined />,   color: "var(--success)" },
          { label: "Today's Entries",  value: stats.todayEntries ?? 0, icon: <LoginOutlined />,  color: "var(--primary)" },
          { label: "Today's Exits",    value: stats.todayExits ?? 0,   icon: <LogoutOutlined />, color: "var(--purple)" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Records table ─────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Gate Entries</Text>
          <Space wrap>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 140 }}
              options={["All", "Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"].map((v) => ({ value: v, label: v }))}
            />
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search name, vehicle, gate..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
              allowClear
            />
          </Space>
        </div>
        <Table
          className="entry-tbl"
          dataSource={filteredEntries}
          rowKey="_id"
          columns={cols}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "25", "50"] }}
          scroll={{ x: 760 }}
          locale={{ emptyText: <Empty description="No gate entries yet" /> }}
        />
      </div>

      <Modal
        title={modalTitle(<AuditOutlined />, "Log Gate Entry", "Record a new visitor, vendor, or staff entry")}
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: "Name is required" }]}>
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="type" initialValue="Visitor">
                <Select options={["Visitor", "Parent", "Vendor", "Contractor", "Staff", "Other"].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Contact number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vehicle No" name="vehicleNo">
                <Input placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Gate" name="gate" initialValue="Main">
                <Select options={["Main", "Side", "Back", "Other"].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Purpose" name="purpose">
                <Input placeholder="Reason for visit" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit" loading={saving} block icon={<PlusOutlined />}>
              Save Entry
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EntryRegister;

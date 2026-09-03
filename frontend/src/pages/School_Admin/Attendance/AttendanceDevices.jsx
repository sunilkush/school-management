import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Empty, Form, Input, Modal, Popconfirm, Select, Spin,
  Switch, Table, Tabs, Tag, Tooltip, Typography, message,
} from "antd";
import {
  DeleteOutlined, IdcardOutlined, PlusOutlined, ReloadOutlined,
  SafetyCertificateOutlined, SyncOutlined, UsbOutlined, WarningOutlined,
} from "@ant-design/icons";
import {
  clearNewCredentials, deleteDevice, enrolCredential, fetchCredentials, fetchDeviceSummary,
  fetchDevices, fetchPunchLog, fetchUnmatched, registerDevice, replayUnmatched,
  revokeCredential, rotateSecret, updateDevice,
} from "../../../features/attendanceDeviceSlice";
import { fetchAllUser } from "../../../features/authSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StatCardsRow from "../../../components/layout/StatCardsRow";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const { Paragraph, Text } = Typography;

const when = (d) => (d ? new Date(d).toLocaleString("en-IN") : "never");

const AttendanceDevices = () => {
  const dispatch = useDispatch();
  const {
    devices, devicesLoading, credentials, credentialsLoading,
    punches, punchesLoading, unmatched, summary, newCredentials, actionLoading,
  } = useSelector((s) => s.attendanceDevice || {});
  const { users = [] } = useSelector((s) => s.auth || {});

  const [tab, setTab] = useState("devices");
  const [deviceForm] = Form.useForm();
  const [cardForm] = Form.useForm();
  const [deviceModal, setDeviceModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefillCard, setPrefillCard] = useState(null);

  useEffect(() => {
    dispatch(fetchDevices());
    dispatch(fetchDeviceSummary());
  }, [dispatch]);

  useEffect(() => {
    if (tab === "cards") { dispatch(fetchCredentials()); dispatch(fetchUnmatched()); dispatch(fetchAllUser({ limit: 1000 })); }
    if (tab === "log") dispatch(fetchPunchLog());
  }, [dispatch, tab]);

  const openAdd = () => {
    setEditing(null);
    deviceForm.resetFields();
    deviceForm.setFieldsValue({ deviceType: "biometric", punchMode: "auto", appliesTo: ["staff"] });
    setDeviceModal(true);
  };

  const openEdit = (device) => {
    setEditing(device);
    deviceForm.setFieldsValue({
      name: device.name, location: device.location, deviceType: device.deviceType,
      punchMode: device.punchMode, appliesTo: device.appliesTo, isActive: device.isActive,
    });
    setDeviceModal(true);
  };

  const saveDevice = async () => {
    const values = await deviceForm.validateFields();
    const res = await dispatch(editing ? updateDevice({ id: editing._id, ...values }) : registerDevice(values));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editing ? "Device updated" : "Device registered");
      setDeviceModal(false);
      dispatch(fetchDevices());
    } else {
      message.error(res.payload || "Could not save the device");
    }
  };

  const removeDevice = async (device) => {
    const res = await dispatch(deleteDevice(device._id));
    if (deleteDevice.fulfilled.match(res)) { message.success("Device deleted"); dispatch(fetchDevices()); }
    else message.error(res.payload || "Could not delete the device");
  };

  const rotate = async (device) => {
    const res = await dispatch(rotateSecret(device._id));
    if (!rotateSecret.fulfilled.match(res)) message.error(res.payload || "Could not rotate the secret");
  };

  const enrol = async () => {
    const values = await cardForm.validateFields();
    const res = await dispatch(enrolCredential(values));
    if (enrolCredential.fulfilled.match(res)) {
      message.success("Card enrolled");
      cardForm.resetFields();
      setPrefillCard(null);
      dispatch(fetchCredentials());
      dispatch(fetchUnmatched());
    } else {
      message.error(res.payload || "Could not enrol the card");
    }
  };

  const revoke = async (row) => {
    const res = await dispatch(revokeCredential(row._id));
    if (revokeCredential.fulfilled.match(res)) { message.success("Card revoked"); dispatch(fetchCredentials()); }
    else message.error(res.payload || "Could not revoke the card");
  };

  const replay = async () => {
    const res = await dispatch(replayUnmatched({}));
    if (replayUnmatched.fulfilled.match(res)) {
      message.success(res.payload?.applied ? `${res.payload.applied} attendance record(s) updated` : "Nothing left to reprocess");
      dispatch(fetchUnmatched());
    } else {
      message.error(res.payload || "Could not reprocess the scans");
    }
  };

  const deviceColumns = [
    {
      title: "Device", dataIndex: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.location || "no location set"} · {r.deviceType}
          </div>
        </div>
      ),
    },
    {
      title: "Reads", dataIndex: "punchMode", width: 150,
      render: (mode, r) => (
        <div style={{ fontSize: 12 }}>
          <div>{mode === "auto" ? "first in, last out" : mode}</div>
          <div style={{ color: "var(--text-muted)" }}>{(r.appliesTo || []).join(", ")}</div>
        </div>
      ),
    },
    {
      title: "Last heard from", width: 200,
      render: (_, r) =>
        r.isHealthy ? (
          <span style={{ fontSize: 13 }}>{when(r.lastSeenAt)}</span>
        ) : (
          <Tooltip title="A silent reader marks nobody, and everyone it covers reads as absent — which looks exactly like a school where nobody turned up.">
            <span style={pill("var(--warning)")}><WarningOutlined /> {r.lastSeenAt ? when(r.lastSeenAt) : "never"}</span>
          </Tooltip>
        ),
    },
    { title: "Scans", dataIndex: "totalPunches", width: 90, align: "right" },
    {
      title: "Status", dataIndex: "isActive", width: 100,
      render: (active) => <span style={pill(active ? "var(--success)" : "var(--text-muted)")}>{active ? "Active" : "Off"}</span>,
    },
    {
      title: "", width: 210, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
          <Popconfirm
            title="Rotate the secret?"
            description="The device stops working until its new secret is entered on the reader."
            onConfirm={() => rotate(r)}
          >
            <Tooltip title="Rotate secret"><Button size="small" icon={<SafetyCertificateOutlined />} /></Tooltip>
          </Popconfirm>
          <Popconfirm title="Delete this device?" okButtonProps={{ danger: true }} onConfirm={() => removeDevice(r)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const credentialColumns = [
    { title: "Card / enrolment id", dataIndex: "externalId", render: (v) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "Belongs to", render: (_, r) => r.userId?.name || "—" },
    { title: "Type", dataIndex: "credentialType", width: 110 },
    {
      title: "Status", dataIndex: "isActive", width: 110,
      render: (active) => <span style={pill(active ? "var(--success)" : "var(--text-muted)")}>{active ? "Active" : "Revoked"}</span>,
    },
    {
      title: "", width: 110, align: "right",
      render: (_, r) =>
        r.isActive ? (
          <Popconfirm title="Revoke this card?" onConfirm={() => revoke(r)}>
            <Button size="small" danger>Revoke</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const punchColumns = [
    { title: "Time", dataIndex: "punchedAt", width: 190, render: when },
    { title: "Card", dataIndex: "externalId", width: 160, render: (v) => <span style={{ fontFamily: "monospace" }}>{v}</span> },
    { title: "Person", render: (_, r) => r.userId?.name || <Text type="secondary">not enrolled</Text> },
    { title: "Device", render: (_, r) => r.deviceId?.name || "—" },
    {
      title: "Attendance", width: 130,
      render: (_, r) => (r.appliedAt ? <Tag color="green">recorded</Tag> : <Tag>not applied</Tag>),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("dev-table")}</style>

      <PageHeader
        title="Attendance Devices"
        subtitle="Fingerprint terminals and card readers, and who each card belongs to"
        icon={<UsbOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => { dispatch(fetchDevices()); dispatch(fetchDeviceSummary()); }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add device</Button>
          </div>
        }
      />

      <StatCardsRow
        items={[
          { key: "marked", icon: <IdcardOutlined />, label: "Marked today", value: summary?.marked ?? 0, color: "var(--accent)" },
          { key: "late", icon: <WarningOutlined />, label: "Late today", value: summary?.late ?? 0, color: "var(--warning)" },
          { key: "unknown", icon: <IdcardOutlined />, label: "Unknown cards", value: summary?.unmatchedPunches ?? 0, color: "var(--danger)" },
          { key: "silent", icon: <UsbOutlined />, label: "Silent readers", value: summary?.silentDevices?.length ?? 0, color: "var(--danger)" },
        ]}
      />

      {summary?.silentDevices?.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message={`${summary.silentDevices.length} reader(s) have not reported in over a day`}
          description={`${summary.silentDevices.map((d) => d.name).join(", ")} — until a reader is back, everyone it covers will simply show as absent.`}
        />
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "devices",
            label: "Devices",
            children: devicesLoading && !devices?.length ? (
              <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
            ) : !devices?.length ? (
              <div style={emptyState}>
                <Empty description="No readers registered yet" />
                <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "12px auto" }}>
                  Register a reader here to get its key and secret, then enter those in whatever
                  sends its scans — the vendor software, a script on the school network, or a
                  scheduled upload. Any device that can post a signed batch works; nothing is tied
                  to one brand.
                </p>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add the first device</Button>
              </div>
            ) : (
              <div style={sectionPanel}>
                <div style={tableContainer}>
                  <Table className="dev-table" rowKey="_id" size="middle" pagination={false}
                         columns={deviceColumns} dataSource={devices} />
                </div>
              </div>
            ),
          },
          {
            key: "cards",
            label: "Cards & fingerprints",
            children: (
              <>
                {unmatched?.length > 0 && (
                  <div style={{ ...sectionPanel, borderColor: "var(--warning)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{unmatched.length} card(s) scanned that belong to nobody</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          The scans are kept. Enrol the card and reprocess — the days already
                          scanned become attendance instead of absences to fix by hand.
                        </div>
                      </div>
                      <Button icon={<SyncOutlined />} loading={actionLoading} onClick={replay}>
                        Reprocess scans
                      </Button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {unmatched.map((u) => (
                        <Button
                          key={u.externalId}
                          size="small"
                          onClick={() => { setPrefillCard(u.externalId); cardForm.setFieldsValue({ externalId: u.externalId }); }}
                        >
                          <span style={{ fontFamily: "monospace" }}>{u.externalId}</span> · {u.punches} scan(s)
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>
                    Enrol a card {prefillCard ? <Tag color="blue">{prefillCard}</Tag> : null}
                  </div>
                  <Form form={cardForm} layout="inline" style={{ gap: 10, rowGap: 10, flexWrap: "wrap" }}>
                    <Form.Item name="externalId" rules={[{ required: true, message: "Scan or type the card id" }]}>
                      <Input placeholder="Card / enrolment id" style={{ minWidth: 220 }} />
                    </Form.Item>
                    <Form.Item name="userId" rules={[{ required: true, message: "Pick the person" }]}>
                      <Select
                        showSearch optionFilterProp="label" placeholder="Belongs to" style={{ minWidth: 240 }}
                        options={users.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))}
                      />
                    </Form.Item>
                    <Form.Item name="credentialType" initialValue="rfid">
                      <Select
                        style={{ width: 140 }}
                        options={[
                          { value: "rfid", label: "RFID card" },
                          { value: "biometric", label: "Fingerprint" },
                          { value: "face", label: "Face" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" loading={actionLoading} onClick={enrol}>Enrol</Button>
                    </Form.Item>
                  </Form>
                </div>

                <div style={sectionPanel}>
                  <div style={tableContainer}>
                    <Table
                      className="dev-table" rowKey="_id" size="middle"
                      loading={credentialsLoading}
                      columns={credentialColumns} dataSource={credentials}
                      pagination={{ pageSize: 20, showSizeChanger: false }}
                    />
                  </div>
                </div>
              </>
            ),
          },
          {
            key: "log",
            label: "Scan log",
            children: (
              <div style={sectionPanel}>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
                  Exactly what the readers saw. These are never edited — attendance is worked out
                  from them, so a disputed absence can always be checked against the raw scan.
                </p>
                <div style={tableContainer}>
                  <Table
                    className="dev-table" rowKey="_id" size="middle"
                    loading={punchesLoading}
                    columns={punchColumns} dataSource={punches}
                    pagination={{ pageSize: 25, showSizeChanger: false }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={deviceModal}
        title={editing ? `Edit ${editing.name}` : "Register a device"}
        onCancel={() => setDeviceModal(false)}
        onOk={saveDevice}
        confirmLoading={actionLoading}
        okText={editing ? "Save" : "Register"}
      >
        <Form form={deviceForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Give the device a name" }]}>
            <Input placeholder="Main Gate Reader" />
          </Form.Item>
          <Form.Item name="location" label="Where it is">
            <Input placeholder="Main gate" />
          </Form.Item>
          <Form.Item name="deviceType" label="Type">
            <Select
              options={[
                { value: "biometric", label: "Fingerprint terminal" },
                { value: "rfid", label: "RFID / card reader" },
                { value: "face", label: "Face recognition" },
                { value: "other", label: "Other" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="punchMode" label="How to read a scan"
            extra="A single reader at a door cannot tell which way somebody is walking, so 'first in, last out' is usually right. Only pick entry or exit if the hardware really is one-directional."
          >
            <Select
              options={[
                { value: "auto", label: "First scan in, last scan out" },
                { value: "entry", label: "Entry only" },
                { value: "exit", label: "Exit only" },
              ]}
            />
          </Form.Item>
          <Form.Item name="appliesTo" label="Covers">
            <Select mode="multiple" options={[{ value: "staff", label: "Staff" }, { value: "student", label: "Students" }]} />
          </Form.Item>
          {editing && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        open={!!newCredentials}
        title="Enter these on the device"
        onCancel={() => dispatch(clearNewCredentials())}
        footer={[<Button key="ok" type="primary" onClick={() => dispatch(clearNewCredentials())}>Done</Button>]}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="The secret is shown only now"
          description="It is stored for checking signatures but never displayed again. If it is lost, rotate it and re-enter the new one on the device."
        />
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>DEVICE KEY</div>
        <Paragraph copyable code style={{ wordBreak: "break-all" }}>{newCredentials?.deviceKey}</Paragraph>
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>SECRET</div>
        <Paragraph copyable code style={{ wordBreak: "break-all" }}>{newCredentials?.secret}</Paragraph>
      </Modal>
    </div>
  );
};

export default AttendanceDevices;

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, DatePicker, Empty, Form, Input, Modal, Popconfirm,
  Row, Select, Spin, Table, Tag, message,
} from "antd";
import {
  LoginOutlined, LogoutOutlined, PlusOutlined, SearchOutlined, UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchHostelVisitors, createVisitorEntry, markVisitorExit, deleteVisitorEntry,
} from "../../features/hostelWardenSlice";
import { fetchLibraryStudents } from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import { iconWell, pageWrapper, pill, sectionPanel, statGrid, tableHeadCss } from "../../styles/pageStyles";

const { Option } = Select;
const { TextArea } = Input;

const RELATION_COLORS = { father: "#14B8A6", mother: "#EF4444", guardian: "#0891b2", sibling: "#22C55E", relative: "#F59E0B", friend: "#14B8A6", other: "#64748B" };

const VisitorLog = () => {
  const dispatch = useDispatch();
  const { visitors, visitorsTotal, visitorsToday, visitorsLoading, actionLoading } = useSelector((s) => s.hostelWarden || {});
  const { students = [] } = useSelector((s) => s.library || {});
  const { user } = useSelector((s) => s.auth);
  const schoolId = user?.schoolId?._id || user?.schoolId;

  const [form] = Form.useForm();
  const [addModal, setAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHostelVisitors({ page, limit: 20 }));
    if (schoolId) dispatch(fetchLibraryStudents({ schoolId, limit: 500 }));
  }, [dispatch, page, schoolId]);

  const handleFilter = () => {
    const params = { page: 1, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter.toISOString();
    dispatch(fetchHostelVisitors(params));
    setPage(1);
  };

  const handleAdd = async (values) => {
    try {
      await dispatch(createVisitorEntry(values)).unwrap();
      message.success("Visitor entry logged");
      setAddModal(false);
      form.resetFields();
      dispatch(fetchHostelVisitors({ page: 1, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const handleExit = async (id) => {
    try {
      await dispatch(markVisitorExit({ id })).unwrap();
      message.success("Exit recorded");
      dispatch(fetchHostelVisitors({ page, limit: 20 }));
    } catch (e) { message.error(e || "Failed"); }
  };

  const handleExport = () => {
    const headers = ["Pass No.", "Visitor", "Phone", "Relation", "Purpose", "Student", "Entry", "Exit", "Status"];
    const rows = visitors.map((v) => [
      v.passNumber, v.visitorName, v.visitorPhone, v.relation, v.purpose,
      v.studentId?.name || "—",
      dayjs(v.entryTime).format("DD-MM-YYYY HH:mm"),
      v.exitTime ? dayjs(v.exitTime).format("DD-MM-YYYY HH:mm") : "—",
      v.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `visitors-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const columns = [
    { title: "Pass No.", dataIndex: "passNumber", render: (v) => <span style={{ fontWeight: 600, color: "#14B8A6" }}>{v}</span> },
    {
      title: "Visitor",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.visitorName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.visitorPhone}</div>
        </div>
      ),
    },
    { title: "Relation", dataIndex: "relation", render: (v) => <span style={pill(RELATION_COLORS[v] || "#64748B", `${RELATION_COLORS[v] || "#64748B"}18`)}>{v}</span> },
    { title: "Purpose",  dataIndex: "purpose" },
    { title: "Student",  render: (_, r) => r.studentId?.name || "—" },
    { title: "Entry",    dataIndex: "entryTime", render: (d) => dayjs(d).format("DD MMM, hh:mm A") },
    { title: "Exit",     dataIndex: "exitTime",  render: (d) => d ? dayjs(d).format("DD MMM, hh:mm A") : <Tag color="orange">Still Visiting</Tag> },
    {
      title: "Actions", width: 130,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          {r.status === "visiting" && (
            <Button size="small" icon={<LogoutOutlined />} onClick={() => handleExit(r._id)}>Exit</Button>
          )}
          <Popconfirm title="Delete this record?" onConfirm={() => dispatch(deleteVisitorEntry(r._id)).then(() => dispatch(fetchHostelVisitors({ page, limit: 20 })))} okType="danger">
            <Button size="small" type="text" danger>Del</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("visitor-tbl")}</style>
      <PageHeader
        title="Visitor Log"
        subtitle="Track all hostel visitors — entry, exit, and pass generation"
        icon={<UserOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={handleExport}>Export CSV</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>Log Visitor</Button>
          </div>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div style={statGrid(160)}>
        <div style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
          <div style={iconWell("#14B8A6", 40)}><UserOutlined /></div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#14B8A6", textTransform: "uppercase" }}>Visitors Today</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{visitorsToday}</div>
          </div>
        </div>
        <div style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
          <div style={iconWell("#F59E0B", 40)}><LoginOutlined /></div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase" }}>Currently Visiting</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{visitors.filter((v) => v.status === "visiting").length}</div>
          </div>
        </div>
        <div style={{ ...sectionPanel, marginBottom: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
          <div style={iconWell("#22C55E", 40)}><LogoutOutlined /></div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", textTransform: "uppercase" }}>Total Records</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{visitorsTotal}</div>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div style={{ ...sectionPanel, padding: "12px 18px", display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <Select value={statusFilter} onChange={setStatusFilter} placeholder="Status" style={{ width: 140 }} allowClear>
          <Option value="visiting">Currently Visiting</Option>
          <Option value="exited">Exited</Option>
        </Select>
        <DatePicker onChange={(d) => setDateFilter(d?.toDate())} placeholder="Filter by date" />
        <Button type="primary" onClick={handleFilter} icon={<SearchOutlined />}>Apply</Button>
        <Button onClick={() => { setStatusFilter(""); setDateFilter(null); dispatch(fetchHostelVisitors({ page: 1, limit: 20 })); }}>Clear</Button>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div style={sectionPanel}>
        {visitorsLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="visitor-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={visitors}
            pagination={{ total: visitorsTotal, current: page, pageSize: 20, onChange: setPage, showSizeChanger: false }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description="No visitor records" /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Add Visitor Modal ─────────────────────────────────── */}
      <Modal title="Log Visitor Entry" open={addModal} onCancel={() => setAddModal(false)} onOk={() => form.submit()} confirmLoading={actionLoading} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 8 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="visitorName" label="Visitor Name" rules={[{ required: true }]}>
                <Input placeholder="Full name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="visitorPhone" label="Phone Number" rules={[{ required: true }]}>
                <Input placeholder="Mobile number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="relation" label="Relation to Student" rules={[{ required: true }]}>
                <Select>
                  {["father", "mother", "guardian", "sibling", "relative", "friend", "other"].map((r) => <Option key={r} value={r}>{r}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="studentId" label="Visiting Student" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children" placeholder="Select student">
                  {students.map((s) => <Option key={s._id} value={s._id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="purpose" label="Purpose of Visit" rules={[{ required: true }]}>
            <Input placeholder="e.g. Parents visit, Medical checkup" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="idType" label="ID Type">
                <Select allowClear placeholder="Optional">
                  {["aadhar", "voter_id", "passport", "driving_licence", "pan", "other"].map((t) => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="idNumber" label="ID Number">
                <Input placeholder="ID card number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VisitorLog;

import React, { useEffect, useState } from "react";
import {
  Input, Button, Table, Modal, Select, Switch, Tag, Typography,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, BookOutlined, CodeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createClass, fetchAllClasses } from "../../../features/classSlice";

const { Title } = Typography;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --brand:       #4f6ef7;
    --brand-light: #eef1ff;
    --brand-dark:  #3a56d4;
    --bg:          #f5f6fa;
    --surface:     #ffffff;
    --border:      #e8eaf0;
    --text:        #1a1d2e;
    --muted:       #7c82a0;
    --success:     #22c55e;
    --danger:      #ef4444;
  }

  .cp-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Sora', sans-serif !important;
    padding: 36px 44px;
  }

  /* ── header ── */
  .cp-page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .cp-header-left { display: flex; align-items: center; gap: 14px; }
  .cp-icon-box {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, var(--brand), #818cf8);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    color: #fff;
    box-shadow: 0 6px 20px rgba(79,110,247,.3);
    flex-shrink: 0;
  }
  .cp-page-title {
    font-family: 'Sora', sans-serif !important;
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: var(--text) !important;
    margin: 0 !important;
    line-height: 1.2 !important;
  }
  .cp-page-sub {
    font-size: 0.78rem;
    color: var(--muted);
    margin-top: 2px;
  }
  .cp-add-btn.ant-btn {
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    height: 42px;
    padding: 0 22px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--brand), #818cf8);
    border: none !important;
    box-shadow: 0 4px 16px rgba(79,110,247,.35);
    color: #fff !important;
    transition: opacity .2s, transform .15s !important;
  }
  .cp-add-btn.ant-btn:hover {
    opacity: 0.88 !important;
    transform: translateY(-1px);
    background: linear-gradient(135deg, var(--brand), #818cf8) !important;
    box-shadow: 0 6px 22px rgba(79,110,247,.45) !important;
  }

  /* ── stats ── */
  .cp-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
  }
  .cp-stat-card {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 6px rgba(0,0,0,.04);
    transition: box-shadow .2s, transform .2s;
  }
  .cp-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
  .cp-stat-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.05rem;
    flex-shrink: 0;
  }
  .cp-stat-icon.blue  { background: var(--brand-light); color: var(--brand); }
  .cp-stat-icon.green { background: #dcfce7; color: var(--success); }
  .cp-stat-icon.red   { background: #fee2e2; color: var(--danger); }
  .cp-stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1; }
  .cp-stat-label { font-size: 0.74rem; color: var(--muted); margin-top: 3px; }

  /* ── table ── */
  .cp-table-card {
    background: var(--surface);
    border-radius: 16px;
    border: 1px solid var(--border);
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,.05);
  }
  .cp-table-card .ant-table {
    font-family: 'Sora', sans-serif;
    background: transparent;
  }
  .cp-table-card .ant-table-thead > tr > th {
    background: #f8f9ff !important;
    color: var(--muted) !important;
    font-family: 'Sora', sans-serif;
    font-size: 0.71rem;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border) !important;
    padding: 13px 20px;
  }
  .cp-table-card .ant-table-tbody > tr > td {
    padding: 14px 20px;
    border-bottom: 1px solid #f0f1f8 !important;
    font-size: 0.875rem;
    color: var(--text);
    font-family: 'Sora', sans-serif;
  }
  .cp-table-card .ant-table-tbody > tr:hover > td { background: #fafbff !important; }
  .cp-table-card .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .cp-table-card .ant-pagination { padding: 12px 20px; margin: 0 !important; }

  .row-index {
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--muted);
    background: var(--bg);
    border-radius: 6px;
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .class-name-cell { display: flex; align-items: center; gap: 10px; }
  .class-avatar {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: linear-gradient(135deg, var(--brand-light), #e0e7ff);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    color: var(--brand);
    flex-shrink: 0;
  }
  .class-name-text { font-weight: 600; color: var(--text); }
  .code-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.77rem;
    font-weight: 500;
    background: #f1f3ff;
    color: var(--brand-dark);
    padding: 3px 10px;
    border-radius: 7px;
    border: 1px solid #dde2ff;
  }
  .status-tag.ant-tag {
    font-family: 'Sora', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 100px;
    padding: 3px 12px;
    border: none;
    display: inline-flex; align-items: center; gap: 5px;
    margin: 0;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .scope-tag.ant-tag {
    font-family: 'Sora', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 100px;
    padding: 2px 10px;
    margin: 0;
  }

  /* ── modal ── */
  .cp-modal .ant-modal-content {
    border-radius: 20px;
    padding: 0;
    overflow: hidden;
    font-family: 'Sora', sans-serif;
    box-shadow: 0 20px 60px rgba(0,0,0,.13);
    border: 1px solid var(--border);
  }
  .cp-modal .ant-modal-header {
    background: linear-gradient(135deg, var(--brand) 0%, #818cf8 100%);
    padding: 22px 28px 18px;
    border-bottom: none;
    margin: 0;
  }
  .cp-modal .ant-modal-title {
    font-family: 'Sora', sans-serif !important;
    font-size: 1.1rem !important;
    font-weight: 700 !important;
    color: #fff !important;
  }
  .cp-modal .ant-modal-close {
    top: 16px; right: 20px;
    color: rgba(255,255,255,.75) !important;
  }
  .cp-modal .ant-modal-close:hover {
    color: #fff !important;
    background: rgba(255,255,255,.15) !important;
    border-radius: 8px;
  }
  .cp-modal .ant-modal-body { padding: 24px 28px 28px; }

  /* ── form ── */
  .cp-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .cp-field-full { grid-column: 1 / -1; }
  .cp-field-label {
    display: block;
    font-size: 0.73rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
    font-family: 'Sora', sans-serif;
  }
  .cp-field .ant-input,
  .cp-field .ant-select .ant-select-selector,
  .cp-field .ant-input-affix-wrapper,
  .cp-field textarea.ant-input {
    font-family: 'Sora', sans-serif !important;
    font-size: 0.875rem !important;
    border-radius: 10px !important;
    border-color: var(--border) !important;
    background: #fafbff !important;
    color: var(--text) !important;
  }
  .cp-field .ant-input:focus,
  .cp-field .ant-select-focused .ant-select-selector,
  .cp-field textarea.ant-input:focus {
    border-color: var(--brand) !important;
    box-shadow: 0 0 0 3px rgba(79,110,247,.1) !important;
  }

  .cp-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fafbff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 16px;
  }
  .cp-toggle-title { font-size: 0.875rem; font-weight: 500; color: var(--text); }
  .cp-toggle-desc  { font-size: 0.74rem; color: var(--muted); margin-top: 2px; }
  .cp-toggle-row .ant-switch-checked { background: var(--brand) !important; }

  .cp-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .cp-modal-footer .ant-btn {
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    height: 40px;
    border-radius: 10px;
    font-size: 0.875rem;
  }
  .cp-modal-footer .ant-btn-primary {
    background: linear-gradient(135deg, var(--brand), #818cf8) !important;
    border: none !important;
    box-shadow: 0 4px 14px rgba(79,110,247,.3);
  }
  .cp-modal-footer .ant-btn-primary:hover {
    opacity: 0.88 !important;
  }
  .cp-modal-footer .ant-btn-default {
    border-color: var(--border) !important;
    color: var(--muted) !important;
  }
  .cp-modal-footer .ant-btn-default:hover {
    border-color: var(--brand) !important;
    color: var(--brand) !important;
  }
`;

const INIT = {
  name: "", code: "", description: "",
  status: "active", isActive: true, isGlobal: false,
};

export default function ClassPage() {
  const dispatch = useDispatch();
  const { classList = [], loading: classLoading } = useSelector((s) => s.class);

  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(INIT);

  useEffect(() => { dispatch(fetchAllClasses()); }, [dispatch]);

  const handleChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const resetForm  = () => setFormData(INIT);

  const handleSave = async () => {
    setSaving(true);
    await dispatch(createClass(formData));
    dispatch(fetchAllClasses());
    resetForm();
    setSaving(false);
    setOpen(false);
  };

  const total    = classList.length;
  const active   = classList.filter((c) => c.status === "active").length;
  const inactive = total - active;

  const columns = [
    {
      title: "#",
      key: "index",
      width: 54,
      render: (_, __, i) => (
        <span className="row-index">{String(i + 1).padStart(2, "0")}</span>
      ),
    },
    {
      title: "Class Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <div className="class-name-cell">
          <div className="class-avatar">{name?.[0]?.toUpperCase() || "C"}</div>
          <span className="class-name-text">{name}</span>
        </div>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span className="code-badge">
          <CodeOutlined style={{ fontSize: 11 }} />
          {code}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) =>
        status === "active" ? (
          <Tag color="success" className="status-tag">
            <span className="status-dot" /> Active
          </Tag>
        ) : (
          <Tag color="error" className="status-tag">
            <span className="status-dot" /> Inactive
          </Tag>
        ),
    },
    {
      title: "Scope",
      dataIndex: "isGlobal",
      key: "isGlobal",
      render: (v) =>
        v
          ? <Tag color="blue"    className="scope-tag">Global</Tag>
          : <Tag color="default" className="scope-tag">Local</Tag>,
    },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="cp-root">

        {/* ── Header ── */}
        <div className="cp-page-header">
          <div className="cp-header-left">
            <div className="cp-icon-box"><BookOutlined /></div>
            <div>
              <Title level={3} className="cp-page-title">Class List</Title>
              <div className="cp-page-sub">Manage and organise all academic classes</div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="cp-add-btn"
            onClick={() => setOpen(true)}
          >
            Add Class
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="cp-stats">
          {[
            { icon: <BookOutlined />, cls: "blue",  value: total,    label: "Total Classes" },
            { icon: "✓",              cls: "green", value: active,   label: "Active"        },
            { icon: "✕",              cls: "red",   value: inactive, label: "Inactive"      },
          ].map(({ icon, cls, value, label }) => (
            <div className="cp-stat-card" key={label}>
              <div className={`cp-stat-icon ${cls}`}>{icon}</div>
              <div>
                <div className="cp-stat-value">{value}</div>
                <div className="cp-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="cp-table-card">
          <Table
            columns={columns}
            dataSource={classList}
            loading={classLoading}
            rowKey="_id"
            pagination={{ pageSize: 8, size: "small" }}
          />
        </div>

      </div>

      {/* ── Modal ── */}
      <Modal
        title="Create New Class"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        className="cp-modal"
        width={520}
        destroyOnClose
      >
        <div className="cp-form-grid">

          {/* Name */}
          <div className="cp-field">
            <span className="cp-field-label">Class Name</span>
            <Input
              placeholder="e.g. Science — Grade 10"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Code */}
          <div className="cp-field">
            <span className="cp-field-label">Class Code</span>
            <Input
              placeholder="e.g. SCI-10A"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="cp-field cp-field-full">
            <span className="cp-field-label">Description</span>
            <Input.TextArea
              placeholder="Short description about this class..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="cp-field cp-field-full">
            <span className="cp-field-label">Status</span>
            <Select
              style={{ width: "100%" }}
              value={formData.status}
              onChange={(v) => handleChange("status", v)}
              options={[
                { label: "Active",   value: "active"   },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          {/* Global Toggle */}
          <div className="cp-field cp-field-full">
            <div className="cp-toggle-row">
              <div>
                <div className="cp-toggle-title">Make Global</div>
                <div className="cp-toggle-desc">Available across all branches</div>
              </div>
              <Switch
                checked={formData.isGlobal}
                onChange={(v) => handleChange("isGlobal", v)}
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="cp-modal-footer">
          <Button icon={<ReloadOutlined />} onClick={resetForm}>Reset</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save Class
          </Button>
        </div>
      </Modal>
    </>
  );
}

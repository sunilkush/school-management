import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, Empty, Form, Input, InputNumber, Modal, Progress, Select,
  Spin, Switch, Table, Tabs, Tag, Tooltip, message,
} from "antd";
import {
  BankOutlined, CheckCircleOutlined, DownloadOutlined, EditOutlined,
  ReloadOutlined, SafetyOutlined, WarningOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  bulkSaveStudentCompliance, fetchComplianceExport, fetchReadiness, fetchRte,
  fetchSchoolCompliance, fetchStudentCompliance, saveSchoolCompliance, saveStudentCompliance,
} from "../../../features/complianceSlice";
import PageHeader from "../../../components/layout/PageHeader";
import StatCardsRow from "../../../components/layout/StatCardsRow";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const SOCIAL_CATEGORIES = ["General", "OBC", "SC", "ST", "Other"];
const MINORITY_GROUPS = ["None", "Muslim", "Christian", "Sikh", "Buddhist", "Parsi", "Jain"];
const RTE_CATEGORIES = ["EWS", "Disadvantaged Group", "Other"];

const APAAR_LABEL = {
  issued: { text: "ID issued", color: "var(--success)" },
  consented: { text: "consent given", color: "var(--warning)" },
  no_consent: { text: "no consent", color: "var(--text-muted)" },
};

const CompliancePage = () => {
  const dispatch = useDispatch();
  const {
    school, schoolLoading, students, studentsLoading,
    readiness, readinessLoading, rte, rteLoading, actionLoading,
  } = useSelector((s) => s.compliance || {});

  const [tab, setTab] = useState("readiness");
  const [schoolForm] = Form.useForm();
  const [studentForm] = Form.useForm();
  const [editing, setEditing] = useState(null);
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchSchoolCompliance());
    dispatch(fetchReadiness());
  }, [dispatch]);

  useEffect(() => {
    if (school) schoolForm.setFieldsValue(school);
  }, [school, schoolForm]);

  useEffect(() => {
    if (tab === "students") dispatch(fetchStudentCompliance({ incompleteOnly, search }));
    if (tab === "rte") dispatch(fetchRte());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, tab, incompleteOnly]);

  const saveSchool = async () => {
    const values = await schoolForm.validateFields();
    const res = await dispatch(saveSchoolCompliance(values));
    if (saveSchoolCompliance.fulfilled.match(res)) {
      message.success("School details saved");
      dispatch(fetchSchoolCompliance());
      dispatch(fetchReadiness());
    } else {
      message.error(res.payload || "Could not save");
    }
  };

  const openStudent = (row) => {
    setEditing(row);
    studentForm.setFieldsValue({
      ...row.compliance,
      apaarConsent: row.compliance?.apaarConsent?.given || false,
    });
  };

  const saveStudent = async () => {
    const values = await studentForm.validateFields();
    const res = await dispatch(saveStudentCompliance({ id: editing.studentId, ...values }));
    if (saveStudentCompliance.fulfilled.match(res)) {
      message.success("Saved");
      setEditing(null);
      dispatch(fetchStudentCompliance({ incompleteOnly, search }));
      dispatch(fetchReadiness());
    } else {
      message.error(res.payload || "Could not save");
    }
  };

  /** Marks every listed child with one value — the realistic case for a whole class that shares
   *  a mother tongue, rather than opening 40 dialogs. */
  const applyToAll = async (field, value) => {
    const rows = students.map((s) => ({ studentId: s.studentId, [field]: value }));
    const res = await dispatch(bulkSaveStudentCompliance(rows));
    if (bulkSaveStudentCompliance.fulfilled.match(res)) {
      message.success(`${res.payload.updated} student(s) updated`);
      dispatch(fetchStudentCompliance({ incompleteOnly, search }));
      dispatch(fetchReadiness());
    } else {
      message.error(res.payload || "Could not update");
    }
  };

  const downloadSheet = async () => {
    const res = await dispatch(fetchComplianceExport());
    if (!fetchComplianceExport.fulfilled.match(res)) {
      message.error(res.payload || "Could not build the export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(res.payload || []);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "UDISE");
    XLSX.writeFile(book, `udise-students-${dayjs().format("YYYY-MM-DD")}.xlsx`);
  };

  const readyPercent = readiness?.totalStudents
    ? Math.round((readiness.readyStudents / readiness.totalStudents) * 100)
    : 0;

  const studentColumns = [
    {
      title: "Student", dataIndex: "name",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.className || "no class"}{r.sectionName ? ` · ${r.sectionName}` : ""}
            {r.registrationNumber ? ` · ${r.registrationNumber}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "PEN", width: 140,
      render: (_, r) => r.compliance?.pen
        ? <span style={{ fontFamily: "monospace" }}>{r.compliance.pen}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
    {
      title: "APAAR", width: 140,
      render: (_, r) => {
        const s = APAAR_LABEL[r.apaarStatus] || APAAR_LABEL.no_consent;
        return <span style={pill(s.color)}>{s.text}</span>;
      },
    },
    { title: "Category", width: 110, render: (_, r) => r.compliance?.socialCategory || "—" },
    {
      title: "RTE", width: 90,
      render: (_, r) => (r.compliance?.rteAdmission ? <Tag color="blue">RTE</Tag> : null),
    },
    {
      title: "Still needed",
      render: (_, r) =>
        r.isComplete ? (
          <span style={pill("var(--success)")}><CheckCircleOutlined /> complete</span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.missing.map((m) => m.label).join(", ")}
          </span>
        ),
    },
    {
      title: "", width: 70, align: "right",
      render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => openStudent(r)} />,
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("comp-table")}</style>

      <PageHeader
        title="Government Compliance"
        subtitle="UDISE+, PEN, APAAR and RTE records"
        icon={<SafetyOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchReadiness())} />
            <Button icon={<DownloadOutlined />} loading={actionLoading} onClick={downloadSheet}>
              Download sheet
            </Button>
          </div>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 14 }}
        message="This does not file anything with the government"
        description="UDISE+ has no public interface for a school ERP to submit through — the return is filed on the portal itself. What this does is hold the identifiers and tell you exactly which records are still incomplete, which is the part that takes days."
      />

      <StatCardsRow
        items={[
          { key: "ready", icon: <CheckCircleOutlined />, label: "Ready to file", value: `${readiness?.readyStudents ?? 0} / ${readiness?.totalStudents ?? 0}`, color: "var(--success)" },
          { key: "incomplete", icon: <WarningOutlined />, label: "Incomplete", value: readiness?.incompleteStudents ?? 0, color: "var(--warning)" },
          { key: "apaar", icon: <SafetyOutlined />, label: "APAAR issued", value: readiness?.apaar?.issued ?? 0, color: "var(--accent)" },
          { key: "consent", icon: <WarningOutlined />, label: "No APAAR consent", value: readiness?.apaar?.no_consent ?? 0, color: "var(--danger)" },
        ]}
      />

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "readiness",
            label: "Readiness",
            children: readinessLoading && !readiness ? (
              <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
            ) : (
              <>
                {!readiness?.schoolIdentifiersComplete && (
                  <Alert
                    type="warning" showIcon style={{ marginBottom: 16, borderRadius: 14 }}
                    message="The school has no UDISE code recorded"
                    description="Every return and every RTE claim is filed against it. Add it on the School details tab."
                  />
                )}

                <div style={sectionPanel}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ fontWeight: 700 }}>Student records ready to file</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {readiness?.readyStudents ?? 0} of {readiness?.totalStudents ?? 0}
                    </div>
                  </div>
                  <Progress percent={readyPercent} status={readyPercent === 100 ? "success" : "active"} />
                </div>

                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>What is missing</div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
                    Grouped by field on purpose — &ldquo;212 children have no mother tongue&rdquo; is an
                    afternoon&rsquo;s work, while 212 separate rows is a job nobody starts.
                  </p>
                  {!readiness?.missingByField?.length ? (
                    <div style={emptyState}>
                      <Empty description="Nothing missing — every record is complete" />
                    </div>
                  ) : (
                    <div style={tableContainer}>
                      <Table
                        className="comp-table" rowKey="key" size="middle" pagination={false}
                        dataSource={readiness.missingByField}
                        columns={[
                          { title: "Field", dataIndex: "label" },
                          { title: "Children missing it", dataIndex: "count", align: "right", width: 180,
                            render: (v) => <b style={{ color: "var(--warning)" }}>{v}</b> },
                        ]}
                      />
                    </div>
                  )}
                </div>

                <div style={sectionPanel}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>APAAR</div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
                    Counted separately from the list above: an APAAR ID cannot be created without a
                    parent&rsquo;s consent, so a child without one is a conversation to have, not a
                    field to fill.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={pill("var(--success)")}>{readiness?.apaar?.issued ?? 0} with an ID</span>
                    <span style={pill("var(--warning)")}>{readiness?.apaar?.consented ?? 0} consented, ID pending</span>
                    <span style={pill("var(--text-muted)")}>{readiness?.apaar?.no_consent ?? 0} no consent yet</span>
                  </div>
                </div>
              </>
            ),
          },
          {
            key: "students",
            label: "Student records",
            children: (
              <>
                <div style={{ ...sectionPanel, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Input.Search
                    allowClear placeholder="Search by name, registration no. or PEN" style={{ maxWidth: 320 }}
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    onSearch={() => dispatch(fetchStudentCompliance({ incompleteOnly, search }))}
                  />
                  <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    Only incomplete
                    <Switch size="small" checked={incompleteOnly} onChange={setIncompleteOnly} />
                  </span>
                  <Tooltip title="Sets the same mother tongue on every student currently listed — filter first, then apply.">
                    <Button
                      disabled={!students?.length}
                      onClick={() => {
                        let value = "";
                        Modal.confirm({
                          title: "Set mother tongue for everyone listed",
                          content: <Input placeholder="e.g. Hindi" onChange={(e) => { value = e.target.value; }} />,
                          onOk: () => value.trim() && applyToAll("motherTongue", value.trim()),
                        });
                      }}
                    >
                      Set mother tongue for all listed
                    </Button>
                  </Tooltip>
                </div>

                <div style={sectionPanel}>
                  <div style={tableContainer}>
                    <Table
                      className="comp-table" rowKey="studentId" size="middle"
                      loading={studentsLoading} columns={studentColumns} dataSource={students}
                      pagination={{ pageSize: 25, showSizeChanger: false }}
                    />
                  </div>
                </div>
              </>
            ),
          },
          {
            key: "rte",
            label: "RTE position",
            children: rteLoading && !rte ? (
              <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
            ) : (
              <div style={sectionPanel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Reservation at {rte?.quotaPercent ?? 25}%</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {rte?.rteStudents ?? 0} of {rte?.totalStudents ?? 0} students ({rte?.rtePercent ?? 0}%)
                    </div>
                  </div>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0 }}>
                  Shown per class rather than as one number: a school can look compliant overall
                  while having admitted nobody in the class where it was actually required.
                </p>
                <div style={tableContainer}>
                  <Table
                    className="comp-table" rowKey="className" size="middle" pagination={false}
                    dataSource={rte?.classes || []}
                    columns={[
                      { title: "Class", dataIndex: "className" },
                      { title: "Students", dataIndex: "total", align: "right", width: 110 },
                      { title: "RTE admitted", dataIndex: "rte", align: "right", width: 130 },
                      { title: "Seats required", dataIndex: "quotaSeats", align: "right", width: 140 },
                      {
                        title: "", width: 120,
                        render: (_, r) => (
                          <span style={pill(r.meetsQuota ? "var(--success)" : "var(--warning)")}>
                            {r.meetsQuota ? "met" : "short"}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            ),
          },
          {
            key: "school",
            label: "School details",
            children: (
              <div style={{ ...sectionPanel, maxWidth: 620 }}>
                {schoolLoading && !school ? (
                  <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
                ) : (
                  <Form form={schoolForm} layout="vertical">
                    <Form.Item name="udiseCode" label="UDISE+ code" extra="11 digits, as issued to this school.">
                      <Input placeholder="08123456789" maxLength={11} />
                    </Form.Item>
                    <Form.Item name="affiliationBoard" label="Board">
                      <Select
                        allowClear
                        options={["CBSE", "ICSE / CISCE", "State Board", "IB", "Other"].map((b) => ({ value: b, label: b }))}
                      />
                    </Form.Item>
                    <Form.Item name="affiliationNumber" label="Affiliation number">
                      <Input />
                    </Form.Item>
                    <Form.Item name="recognitionNumber" label="Recognition number">
                      <Input />
                    </Form.Item>
                    <Form.Item name="management" label="Management">
                      <Select
                        allowClear
                        options={["Private Unaided", "Private Aided", "Government", "Government Aided", "Other"].map((m) => ({ value: m, label: m }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="rteQuotaPercent" label="RTE reservation (%)"
                      extra="25% is the Act's figure for private unaided schools. It is editable because it does not apply to every category of school."
                    >
                      <InputNumber min={0} max={100} style={{ width: 140 }} />
                    </Form.Item>
                    <Button type="primary" icon={<BankOutlined />} loading={actionLoading} onClick={saveSchool}>
                      Save
                    </Button>
                  </Form>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!editing}
        width={620}
        title={editing?.name}
        onCancel={() => setEditing(null)}
        onOk={saveStudent}
        confirmLoading={actionLoading}
        okText="Save"
      >
        <Form form={studentForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="pen" label="PEN" extra="11 digits, issued through UDISE+.">
            <Input maxLength={11} />
          </Form.Item>
          <Form.Item name="socialCategory" label="Social category">
            <Select allowClear options={SOCIAL_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="minorityGroup" label="Minority group">
            <Select allowClear options={MINORITY_GROUPS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="motherTongue" label="Mother tongue">
            <Input />
          </Form.Item>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Form.Item name="aadhaarOnFile" label="Aadhaar on file" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="aadhaarLast4" label="Aadhaar last 4"
              extra="Only the last four digits are kept — this is not a place to store whole Aadhaar numbers."
            >
              <Input maxLength={4} style={{ width: 120 }} />
            </Form.Item>
          </div>

          <Form.Item name="apaarConsent" label="Parent's APAAR consent recorded" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="apaarId" label="APAAR ID" extra="12 digits. Cannot be saved before the consent above is recorded.">
            <Input maxLength={12} />
          </Form.Item>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Form.Item name="cwsn" label="Child with special needs" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="bplCard" label="BPL card" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="rteAdmission" label="Admitted under RTE" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="rteCategory" label="RTE category">
            <Select allowClear options={RTE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompliancePage;

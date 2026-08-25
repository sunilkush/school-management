import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { bulkImportStudents, clearBulkImportResult } from "../../features/studentSlice";
import { Upload, Button, Table, Alert, Space, Tag, Divider, Tooltip } from "antd";
import {
  UploadOutlined, CloudUploadOutlined, DownloadOutlined,
  DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import { pageCard } from "../../styles/pageStyles";

const COLUMNS = [
  { key: "name",         label: "name",         required: true,  hint: "Student's full name" },
  { key: "email",        label: "email",        required: true,  hint: "Used as the student's login — must be unique in this school" },
  { key: "className",    label: "className",    required: true,  hint: "Must match an existing class name exactly, e.g. CLASS 8" },
  { key: "sectionName",  label: "sectionName",  required: true,  hint: "Must match an existing section within that class, e.g. A" },
  { key: "gender",       label: "gender",       required: false, hint: "Male | Female | Other" },
  { key: "dateOfBirth",  label: "dateOfBirth",  required: false, hint: "YYYY-MM-DD" },
  { key: "bloodGroup",   label: "bloodGroup",   required: false, hint: "e.g. O+" },
  { key: "address",      label: "address",      required: false, hint: "Free text" },
  { key: "mobileNumber", label: "mobileNumber", required: false, hint: "Student/family contact number" },
  { key: "fatherName",   label: "fatherName",   required: false, hint: "" },
  { key: "fatherEmail",  label: "fatherEmail",  required: false, hint: "Creates a Parent login if not already present" },
  { key: "fatherMobile", label: "fatherMobile", required: false, hint: "" },
  { key: "motherName",   label: "motherName",   required: false, hint: "" },
  { key: "motherEmail",  label: "motherEmail",  required: false, hint: "Creates a Parent login if not already present" },
  { key: "motherMobile", label: "motherMobile", required: false, hint: "" },
];

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "2563EB" } },
  alignment: { horizontal: "center", wrapText: true },
};
const requiredHeaderStyle = { ...headerStyle, fill: { fgColor: { rgb: "DC2626" } } };
const sampleStyle = { fill: { fgColor: { rgb: "F0FDF4" } }, alignment: { wrapText: true } };
const refHeaderStyle = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, fill: { fgColor: { rgb: "7C3AED" } }, alignment: { horizontal: "center" } };

const downloadTemplate = (classOptions = []) => {
  const wb = XLSX.utils.book_new();

  const sampleClass = classOptions[0]?.name || "CLASS 6";
  const sampleSection = classOptions[0]?.sections?.[0]?.name || "A";

  const headers = COLUMNS.map((c) => c.label);
  const sampleRows = [
    {
      name: "Aarav Sharma", email: "aarav.sharma@example.com",
      className: sampleClass, sectionName: sampleSection,
      gender: "Male", dateOfBirth: "2015-04-12", bloodGroup: "O+",
      address: "12 MG Road, Delhi", mobileNumber: "9876500001",
      fatherName: "Rakesh Sharma", fatherEmail: "rakesh.sharma@example.com", fatherMobile: "9876500001",
      motherName: "Sunita Sharma", motherEmail: "", motherMobile: "",
    },
    {
      name: "Diya Patel", email: "diya.patel@example.com",
      className: sampleClass, sectionName: sampleSection,
      gender: "Female", dateOfBirth: "2015-08-23", bloodGroup: "A+",
      address: "45 Park Street, Delhi", mobileNumber: "9876500002",
      fatherName: "", fatherEmail: "", fatherMobile: "",
      motherName: "Meera Patel", motherEmail: "meera.patel@example.com", motherMobile: "9876500002",
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  ws1["!cols"] = COLUMNS.map(() => ({ wch: 22 }));
  const alphaCols = "ABCDEFGHIJKLMNO".split("");
  COLUMNS.forEach((col, i) => {
    const ref = `${alphaCols[i]}1`;
    if (!ws1[ref]) ws1[ref] = { v: col.label, t: "s" };
    ws1[ref].s = col.required ? requiredHeaderStyle : headerStyle;
  });
  for (let r = 2; r <= sampleRows.length + 1; r++) {
    alphaCols.slice(0, COLUMNS.length).forEach((c) => {
      const ref = `${c}${r}`;
      if (ws1[ref]) ws1[ref].s = sampleStyle;
    });
  }
  XLSX.utils.book_append_sheet(wb, ws1, "Students Template");

  // Sheet 2 — real class/section names available for this school+academic year
  const refRows = [];
  classOptions.forEach((cls) => {
    (cls.sections || []).forEach((sec) => {
      refRows.push({ "Class Name (copy into className)": cls.name, "Section Name (copy into sectionName)": sec.name });
    });
    if (!cls.sections?.length) {
      refRows.push({ "Class Name (copy into className)": cls.name, "Section Name (copy into sectionName)": "(no sections found)" });
    }
  });
  if (!refRows.length) {
    refRows.push({ "Class Name (copy into className)": "No classes found", "Section Name (copy into sectionName)": "—" });
  }
  const ws2 = XLSX.utils.json_to_sheet(refRows);
  ws2["!cols"] = [{ wch: 30 }, { wch: 30 }];
  ["A1", "B1"].forEach((ref) => { if (ws2[ref]) ws2[ref].s = refHeaderStyle; });
  XLSX.utils.book_append_sheet(wb, ws2, "Classes & Sections");

  // Sheet 3 — instructions
  const instrRows = [
    ["Column", "Required?", "Format", "Example"],
    ["name", "✅ Yes", "Full name", "Aarav Sharma"],
    ["email", "✅ Yes", "Valid email, unique in this school — becomes the student's login", "aarav.sharma@example.com"],
    ["className", "✅ Yes", "Must exactly match a class from Sheet 2", "CLASS 8"],
    ["sectionName", "✅ Yes", "Must exactly match a section from Sheet 2 within that class", "A"],
    ["gender", "No", "Male | Female | Other", "Male"],
    ["dateOfBirth", "No", "YYYY-MM-DD", "2015-04-12"],
    ["bloodGroup", "No", "Free text", "O+"],
    ["address", "No", "Free text", "12 MG Road, Delhi"],
    ["mobileNumber", "No", "Contact number", "9876500001"],
    ["fatherName / fatherEmail / fatherMobile", "No", "If fatherEmail is given, a Parent login is created (or reused if that email already exists)", ""],
    ["motherName / motherEmail / motherMobile", "No", "Same as above, for the mother", ""],
    [],
    ["💡 Tips", "", "", ""],
    ["1", "Every row needs its own unique email — duplicate emails (within the file or already in the school) are rejected.", "", ""],
    ["2", "Rows with errors are skipped and reported individually — valid rows in the same file are still imported.", "", ""],
    ["3", "Auto-generated login passwords are shown after upload — save them, they are not emailed automatically.", "", ""],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(instrRows);
  ws3["!cols"] = [{ wch: 40 }, { wch: 12 }, { wch: 55 }, { wch: 26 }];
  ["A1", "B1", "C1", "D1"].forEach((ref) => { if (ws3[ref]) ws3[ref].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "D97706" } } }; });
  XLSX.utils.book_append_sheet(wb, ws3, "Instructions");

  XLSX.writeFile(wb, "student_bulk_import_template.xlsx");
};

/**
 * Props:
 *  schoolId, academicYearId — required, scope the import
 *  classOptions — [{ _id, name, sections: [{_id, name}] }] used for the template's reference sheet
 *  onSuccess — called after a successful (even partially successful) import, to refresh the list
 */
const BulkImportStudentsSheet = ({ schoolId, academicYearId, classOptions = [], onSuccess }) => {
  const dispatch = useDispatch();
  const { bulkImportLoading, bulkImportResult } = useSelector((s) => s.students || {});

  const [rows, setRows] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);

  // Parent renders this inside a Modal with destroyOnClose, so local state naturally resets on
  // reopen — but bulkImportResult lives in Redux and would otherwise still show a previous
  // session's results the next time this modal opens.
  useEffect(() => () => { dispatch(clearBulkImportResult()); }, [dispatch]);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false });
        setRows(data);
      } catch {
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleUpload = async () => {
    if (!rows.length || !schoolId || !academicYearId) return;
    setShowCredentials(false);
    await dispatch(bulkImportStudents({ schoolId, academicYearId, rows })).unwrap().catch(() => {});
    setRows([]);
    onSuccess?.();
  };

  const previewCols = rows.length
    ? Object.keys(rows[0]).map((k) => ({ title: k, dataIndex: k, key: k, ellipsis: true, width: 130 }))
    : [];

  const created = bulkImportResult?.created || [];
  const errors = bulkImportResult?.errors || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...pageCard, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Excel Template Download Karein</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>
              Template mein <strong>3 sheets</strong> hain — sample rows, aapki school ki real class/section names, aur instructions.
            </div>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadTemplate(classOptions)} style={{ flexShrink: 0 }}>
            Template Download
          </Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {COLUMNS.map((c) => (
            <Tooltip key={c.key} title={c.hint}>
              <Tag color={c.required ? "red" : "blue"} style={{ cursor: "help", fontSize: 11 }}>
                {c.label}{c.required ? " *" : ""}
              </Tag>
            </Tooltip>
          ))}
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(var(--warning-rgb), 0.08)", borderRadius: 8, border: "1px solid rgba(var(--warning-rgb), 0.3)", fontSize: 12, color: "var(--warning-hover)", lineHeight: 1.7 }}>
          <InfoCircleOutlined style={{ marginRight: 6 }} />
          <strong>className</strong> aur <strong>sectionName</strong> ke liye — template ki <em>Sheet 2</em> se sahi naam copy karein, spelling bilkul match honi chahiye.
        </div>
      </div>

      <div style={{ ...pageCard, padding: 20 }}>
        {!rows.length && !bulkImportResult && (
          <Upload beforeUpload={handleFile} accept=".xlsx,.xls" maxCount={1} showUploadList={false}>
            <Button icon={<UploadOutlined />} size="large" block>Excel File Select Karein (.xlsx / .xls)</Button>
          </Upload>
        )}

        {rows.length > 0 && (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Preview</span>
                <Tag color="blue" style={{ marginLeft: 8 }}>{rows.length} students</Tag>
              </div>
              <Button size="small" icon={<DeleteOutlined />} onClick={() => setRows([])} danger>Clear</Button>
            </div>
            <Table columns={previewCols} dataSource={rows.slice(0, 10)} rowKey={(_, i) => i} size="small" bordered pagination={false} scroll={{ x: "max-content" }} style={{ fontSize: 12 }} />
            {rows.length > 10 && <Tag color="gold">First 10 rows shown — {rows.length - 10} more will still be uploaded</Tag>}
            <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleUpload} loading={bulkImportLoading} size="large" block>
              {bulkImportLoading ? "Importing..." : `Import ${rows.length} Students`}
            </Button>
          </Space>
        )}

        {bulkImportResult && (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Alert
              type={errors.length && !created.length ? "error" : created.length && errors.length ? "warning" : "success"}
              showIcon
              message={`${created.length} imported, ${errors.length} failed`}
            />

            {created.length > 0 && (
              <>
                <Divider style={{ margin: "4px 0" }} orientation="left" orientationMargin={0}>
                  <CheckCircleOutlined style={{ color: "var(--success)", marginRight: 6 }} />Successfully Imported
                </Divider>
                <Table
                  size="small" bordered pagination={false}
                  dataSource={created}
                  rowKey="row"
                  columns={[
                    { title: "Row", dataIndex: "row", width: 60 },
                    { title: "Name", dataIndex: "name" },
                    { title: "Email (login)", dataIndex: "email" },
                    { title: "Reg No.", dataIndex: "registrationNumber" },
                    { title: "Roll No.", dataIndex: "rollNumber", width: 80 },
                  ]}
                />
                <Button size="small" onClick={() => setShowCredentials((v) => !v)}>
                  {showCredentials ? "Hide" : "Show"} Auto-Generated Passwords
                </Button>
                {showCredentials && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Save these now — they are not emailed automatically and won't be shown again."
                    description={
                      <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
                        {created.map((c) => (
                          <div key={c.row}>
                            {c.email} → {c.credentials?.student?.password}
                            {c.credentials?.father && ` | father: ${c.credentials.father.loginId} → ${c.credentials.father.password}`}
                            {c.credentials?.mother && ` | mother: ${c.credentials.mother.loginId} → ${c.credentials.mother.password}`}
                          </div>
                        ))}
                      </div>
                    }
                  />
                )}
              </>
            )}

            {errors.length > 0 && (
              <>
                <Divider style={{ margin: "4px 0" }} orientation="left" orientationMargin={0}>
                  <CloseCircleOutlined style={{ color: "var(--danger)", marginRight: 6 }} />Failed Rows
                </Divider>
                <Table
                  size="small" bordered pagination={false}
                  dataSource={errors}
                  rowKey="row"
                  columns={[
                    { title: "Row", dataIndex: "row", width: 60 },
                    { title: "Name/Email", dataIndex: "name" },
                    { title: "Reason", dataIndex: "reasons", render: (r) => r.join("; ") },
                  ]}
                />
              </>
            )}

            <Button onClick={() => { setShowCredentials(false); dispatch(clearBulkImportResult()); }} block>
              Aur Import Karein
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
};

export default BulkImportStudentsSheet;

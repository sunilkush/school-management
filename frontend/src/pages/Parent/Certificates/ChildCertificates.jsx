import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Select, Table, Tag, Typography, message } from "antd";
import { DownloadOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyCertificates } from "../../../features/certificateSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function ChildCertificates() {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading } = useSelector((s) => s.studentPortal || {});
  const { myCertificates = [], myLoading = false } = useSelector((s) => s.certificates || {});
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); dispatch(fetchMyCertificates()); }, [dispatch]);
  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0]._id);
  }, [children, selectedChildId]);

  const filtered = useMemo(
    () => myCertificates.filter((c) => `${c.studentId}` === `${selectedChildId}`),
    [myCertificates, selectedChildId]
  );

  const handleDownload = async (cert) => {
    setDownloadingId(cert._id);
    try {
      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/certificates/my/${cert._id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.message || "Download failed"); }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `${cert.certificateNumber}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      message.error(err.message || "Failed to download certificate");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { title: "Certificate No", dataIndex: "certificateNumber", render: (v) => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: "Type", dataIndex: "certificateType" },
    { title: "Issue Date", dataIndex: "issueDate", render: fmt },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "Issued" ? "success" : "error"}>{v}</Tag> },
    {
      title: "Actions", key: "actions",
      render: (_, row) => (
        <Button size="small" icon={<DownloadOutlined />} loading={downloadingId === row._id} disabled={row.status === "Revoked"} onClick={() => handleDownload(row)}>
          Download
        </Button>
      ),
    },
  ];

  return (
    <>
      <style>{tableHeadCss("child-cert-tbl")}</style>
      <PageHeader title="Certificates" subtitle="Certificates issued to your child" icon={<SafetyCertificateOutlined />} />
      <div style={pageWrapper}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Select
            placeholder="Select Child" style={{ width: "100%", maxWidth: 360 }}
            value={selectedChildId} onChange={setSelectedChildId} loading={childrenLoading} size="large"
            options={children.map((c) => ({ value: c._id, label: `${c.name} (${c.className || "—"} - ${c.sectionName || "—"})` }))}
          />
        </div>
        <div style={sectionPanel}>
          <Table
            className="child-cert-tbl" rowKey="_id" columns={columns} dataSource={filtered} loading={myLoading}
            size="middle" pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No certificates issued yet" style={{ padding: "40px 0" }} /> }}
          />
        </div>
      </div>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Empty, Flex, Select, Tag, Typography, message } from "antd";
import { DownloadOutlined, IdcardOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyIdCards } from "../../../features/idCardSlice";
import { getAccessToken } from "../../../api/authToken";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function ChildIdCard() {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading } = useSelector((s) => s.studentPortal || {});
  const { myCards = [], myLoading = false } = useSelector((s) => s.idCards || {});
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); dispatch(fetchMyIdCards()); }, [dispatch]);
  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0]._id);
  }, [children, selectedChildId]);

  const filtered = useMemo(
    () => myCards.filter((c) => `${c.holderId}` === `${selectedChildId}`),
    [myCards, selectedChildId]
  );

  const handleDownload = async (card) => {
    setDownloadingId(card._id);
    try {
      const token = getAccessToken();
      const apiBase = import.meta.env.VITE_API_URL || "/api/v1";
      const res = await fetch(`${apiBase}/id-cards/my/${card._id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.message || "Download failed"); }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `${card.cardNumber}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      message.error(err.message || "Failed to download ID card");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader title="ID Card" subtitle="Your child's issued school ID card(s)" icon={<IdcardOutlined />} />
      <div style={pageWrapper}>
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Select
            placeholder="Select Child" style={{ width: "100%", maxWidth: 360 }}
            value={selectedChildId} onChange={setSelectedChildId} loading={childrenLoading} size="large"
            options={children.map((c) => ({ value: c._id, label: `${c.name} (${c.className || "—"} - ${c.sectionName || "—"})` }))}
          />
        </div>
        {myLoading ? null : filtered.length === 0 ? (
          <div style={sectionPanel}>
            <Empty description="No ID card issued yet" style={{ padding: "40px 0" }} />
          </div>
        ) : (
          filtered.map((card) => (
            <div key={card._id} style={{ ...sectionPanel, marginBottom: 16 }}>
              <Flex align="center" gap={16} wrap="wrap">
                {card.photoUrl
                  ? <Avatar src={card.photoUrl} size={64} />
                  : <Avatar size={64} style={{ background: "#2563EB" }}>{(card.fullName || "?")[0]?.toUpperCase()}</Avatar>}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Text strong style={{ fontSize: 16 }}>{card.fullName}</Text><br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {[card.className, card.sectionName].filter(Boolean).join(" - ")} · Roll {card.rollNumber || "—"}
                  </Text><br />
                  <Text code style={{ fontSize: 11 }}>{card.cardNumber}</Text>
                  {" "}
                  <Tag color={card.status === "Active" ? "success" : "error"}>{card.status}</Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>Valid Until: {fmt(card.validUntil)}</Text>
                </div>
                <Button type="primary" icon={<DownloadOutlined />} loading={downloadingId === card._id} onClick={() => handleDownload(card)}>
                  Download
                </Button>
              </Flex>
            </div>
          ))
        )}
      </div>
    </>
  );
}

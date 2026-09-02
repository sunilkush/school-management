import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Empty, Select, Skeleton, Space, Tabs, message } from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";

import PageHeader from "../../../components/layout/PageHeader";
import ReportCardView from "../../../components/reportCard/ReportCardView";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchChildReportCards, downloadReportCardPdf } from "../../../services/reportCardApi";

export default function ChildReportCards() {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((s) => s.studentPortal || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  // Default to the first child once the list arrives, so the page is useful without a click.
  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    fetchChildReportCards(selectedChildId)
      .then(setCards)
      .catch((err) => message.error(err?.response?.data?.message || "Could not load report cards"))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const childName = children.find((c) => c.userId === selectedChildId)?.name;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Report Cards"
        subtitle="Your child's consolidated results for each term, once the school publishes them."
        icon={<FileTextOutlined />}
        extra={
          children.length > 1 && (
            <Select
              style={{ minWidth: 200 }}
              value={selectedChildId}
              onChange={setSelectedChildId}
              loading={childLoading}
              options={children.map((c) => ({ value: c.userId, label: c.name }))}
            />
          )
        }
      />

      {loading || childLoading ? (
        <div style={sectionPanel}><Skeleton active paragraph={{ rows: 6 }} /></div>
      ) : !children.length ? (
        <div style={sectionPanel}><Empty description="No children linked to your account" /></div>
      ) : !cards.length ? (
        <div style={sectionPanel}>
          <Empty description={`No report cards published for ${childName || "this child"} yet`} />
        </div>
      ) : (
        <Tabs
          items={cards.map((card) => ({
            key: card._id,
            label: card.templateId?.name || "Term",
            children: (
              <>
                <Space style={{ width: "100%", justifyContent: "flex-end", marginBottom: 12 }}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      downloadReportCardPdf(
                        card._id,
                        `${childName || "child"}-${card.templateId?.name || "report-card"}.pdf`
                      )
                    }
                  >
                    Download PDF
                  </Button>
                </Space>
                <ReportCardView card={card} />
              </>
            ),
          }))}
        />
      )}
    </div>
  );
}

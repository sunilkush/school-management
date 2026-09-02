import { useEffect, useState } from "react";
import { Button, Empty, Skeleton, Tabs, message } from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";

import PageHeader from "../../../components/layout/PageHeader";
import ReportCardView from "../../../components/reportCard/ReportCardView";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";
import { fetchMyReportCards, downloadReportCardPdf } from "../../../services/reportCardApi";

export default function MyReportCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReportCards()
      .then(setCards)
      .catch((err) => message.error(err?.response?.data?.message || "Could not load your report cards"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Report Cards"
        subtitle="Consolidated results for each term, once your school publishes them."
        icon={<FileTextOutlined />}
      />

      {loading ? (
        <div style={sectionPanel}><Skeleton active paragraph={{ rows: 6 }} /></div>
      ) : !cards.length ? (
        <div style={sectionPanel}>
          <Empty description="No report cards have been published for you yet" />
        </div>
      ) : (
        <Tabs
          items={cards.map((card) => ({
            key: card._id,
            label: card.templateId?.name || "Term",
            children: (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() =>
                      downloadReportCardPdf(card._id, `${card.templateId?.name || "report-card"}.pdf`)
                    }
                  >
                    Download PDF
                  </Button>
                </div>
                <ReportCardView card={card} />
              </>
            ),
          }))}
        />
      )}
    </div>
  );
}

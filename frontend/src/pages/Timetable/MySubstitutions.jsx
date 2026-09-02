import { useEffect, useState } from "react";
import { Alert, DatePicker, Empty, Skeleton, Table, Typography, message } from "antd";
import { UserSwitchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, toolbarRow } from "../../styles/pageStyles";
import { fetchMySubstitutions } from "../../services/substitutionApi";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function MySubstitutions() {
  // Default to this week — a teacher cares about what is coming, not history.
  const [range, setRange] = useState([dayjs().startOf("week"), dayjs().endOf("week")]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMySubstitutions({
      from: range?.[0]?.format("YYYY-MM-DD"),
      to: range?.[1]?.format("YYYY-MM-DD"),
    })
      .then(setRows)
      .catch((err) => message.error(err?.response?.data?.message || "Could not load your cover duties"))
      .finally(() => setLoading(false));
  }, [range]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (v) => (
        <div>
          <Text strong>{dayjs(v).format("DD MMM")}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format("dddd")}</Text>
        </div>
      ),
    },
    { title: "Period", render: (_, r) => r.timeSlotId?.name || "—" },
    {
      title: "Class",
      render: (_, r) => [r.schoolClassId?.name, r.sectionId?.name].filter(Boolean).join(" — ") || "—",
    },
    { title: "Subject", render: (_, r) => r.subjectId?.name || "—" },
    { title: "Covering for", render: (_, r) => r.absentTeacherId?.name || "—" },
  ];

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Cover Duties"
        subtitle="Periods you have been asked to cover for an absent colleague."
        icon={<UserSwitchOutlined />}
      />

      <div style={sectionPanel}>
        <div style={toolbarRow}>
          <RangePicker value={range} onChange={setRange} format="DD MMM YYYY" allowClear={false} />
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : !rows.length ? (
          <Empty description="No cover duties in this period" />
        ) : (
          <Table
            size="small"
            rowKey="_id"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 700 }}
          />
        )}
      </div>

      {rows.length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="These are one-off covers"
          description="They do not appear on your regular timetable, and only apply to the dates listed above."
        />
      )}
    </div>
  );
}

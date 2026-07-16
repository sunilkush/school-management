import { useEffect, useMemo, useState } from "react";
import { Empty, Select, Table, Tag } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyAchievements } from "../../../features/sportsSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function ChildAchievements() {
  const dispatch = useDispatch();
  const { children = [], loading: childrenLoading } = useSelector((s) => s.studentPortal || {});
  const { myAchievements = [], myLoading = false } = useSelector((s) => s.sports || {});
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); dispatch(fetchMyAchievements()); }, [dispatch]);
  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0]._id);
  }, [children, selectedChildId]);

  const filtered = useMemo(
    () => myAchievements.filter((a) => `${a.studentId}` === `${selectedChildId}`),
    [myAchievements, selectedChildId]
  );

  const columns = [
    { title: "Title", dataIndex: "title" },
    { title: "Level", dataIndex: "level", render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Position", dataIndex: "position", render: (v) => v || "—" },
    { title: "Event", dataIndex: "eventName", render: (v) => v || "—" },
    { title: "Date", dataIndex: "achievementDate", render: fmt },
  ];

  return (
    <>
      <style>{tableHeadCss("child-ach-tbl")}</style>
      <PageHeader title="Achievements" subtitle="Your child's sports and co-curricular achievements" icon={<TrophyOutlined />} />
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
            className="child-ach-tbl" rowKey="_id" columns={columns} dataSource={filtered} loading={myLoading}
            size="middle" pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No achievements recorded yet" style={{ padding: "40px 0" }} /> }}
          />
        </div>
      </div>
    </>
  );
}

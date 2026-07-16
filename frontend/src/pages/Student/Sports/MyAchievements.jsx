import { useEffect } from "react";
import { Empty, Table, Tag } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyAchievements } from "../../../features/sportsSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const fmt = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function MyAchievements() {
  const dispatch = useDispatch();
  const { myAchievements = [], myLoading = false } = useSelector((s) => s.sports || {});

  useEffect(() => {
    dispatch(fetchMyAchievements());
  }, [dispatch]);

  const columns = [
    { title: "Title", dataIndex: "title" },
    { title: "Level", dataIndex: "level", render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Position", dataIndex: "position", render: (v) => v || "—" },
    { title: "Event", dataIndex: "eventName", render: (v) => v || "—" },
    { title: "Date", dataIndex: "achievementDate", render: fmt },
  ];

  return (
    <>
      <style>{tableHeadCss("my-ach-tbl")}</style>
      <PageHeader title="My Achievements" subtitle="Sports and co-curricular achievements" icon={<TrophyOutlined />} />
      <div style={pageWrapper}>
        <div style={sectionPanel}>
          <Table
            className="my-ach-tbl" rowKey="_id" columns={columns} dataSource={myAchievements} loading={myLoading}
            size="middle" pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="No achievements recorded yet" style={{ padding: "40px 0" }} /> }}
          />
        </div>
      </div>
    </>
  );
}

// src/pages/SuperAdmin/Subscription/PlanLogs.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { fetchPlanLogs } from "../../../features/subscriptionPlanSlice";
import { Card, Timeline, Avatar, Spin, Tag, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const renderDiff = (oldData = {}, newData = {}) => {
  // show only changed keys in a small diff style
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  return Array.from(keys).map((k) => {
    const o = oldData[k];
    const n = newData[k];
    if (JSON.stringify(o) === JSON.stringify(n)) return null;
    return (
      <div key={k} style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{k}</div>
        <div style={{ fontSize: 12 }}>
          <span style={{ color: "#999" }}>Old: </span>
          <span style={{ textDecoration: "line-through", marginRight: 12 }}>{typeof o === "object" ? JSON.stringify(o) : String(o)}</span>
          <span style={{ color: "#1890ff" }}>New: </span>
          <span>{typeof n === "object" ? JSON.stringify(n) : String(n)}</span>
        </div>
      </div>
    );
  }).filter(Boolean);
};

const PlanLogs = () => {
  const { id } = useParams(); // plan id
  const dispatch = useDispatch();
  const { planLogs, loading } = useSelector((state) => state.subscriptionPlans);

  useEffect(() => {
    if (id) dispatch(fetchPlanLogs(id));
  }, [dispatch, id]);

  if (loading) return <div className="p-6"><Spin /></div>;

  return (
    <div className="p-5">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Link to="/dashboard/superadmin/subscriptions">
            <Button icon={<ArrowLeftOutlined />}>Back to Plans</Button>
          </Link>
        </div>
        <h2 style={{ margin: 0 }}>Plan Update Logs</h2>
      </div>

      <Card>
        {(!planLogs || planLogs.length === 0) ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
            No update logs found for this plan.
          </div>
        ) : (
          <Timeline>
            {planLogs.map((log) => (
              <Timeline.Item key={log._id} color="blue">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                  <Avatar>{log.updatedBy?.name?.[0] ?? "U"}</Avatar>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {log.updatedBy?.name ?? log.updatedBy?.email ?? "Unknown"}
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {dayjs(log.createdAt).format("DD MMM YYYY, HH:mm")}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  {renderDiff(log.oldData, log.newData)}
                </div>

                <div style={{ marginTop: 12 }}>
                  <Tag color="gold">Changed at {dayjs(log.createdAt).format("DD-MMM-YYYY HH:mm")}</Tag>
                  <Tag color="green">{log.newData?.isActive ? "Active" : "Inactive"}</Tag>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </div>
  );
};

export default PlanLogs;

import React, { useEffect, useMemo } from "react";
import { Spin, Table } from "antd";
import { LayoutDashboard, Users, Phone, HelpCircle, CheckCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGateEntries, fetchGateStats } from "../../features/gateEntrySlice";
import { fetchCallLogs } from "../../features/callLogSlice";
import { fetchInquiries } from "../../features/admissionInquirySlice";
import PageHeader from "../../components/layout/PageHeader.jsx";
import {
  pageWrapper, sectionPanel, statGrid,
  pill, tableHeadCss, emptyState,
} from "../../styles/pageStyles.js";
import { fmt, Avatar, StatCard, RefreshBtn, VISITOR_COLORS } from "./receptionistShared.jsx";

const ReceptionistDashboard = () => {
  const dispatch = useDispatch();
  const { stats, entries, loading } = useSelector((s) => s.gateEntries);
  const { inquiries }               = useSelector((s) => s.admissionInquiry);
  const { logs }                    = useSelector((s) => s.callLogs);

  const refresh = () => {
    dispatch(fetchGateStats());
    dispatch(fetchInquiries({ limit: 500 }));
    dispatch(fetchCallLogs({ limit: 500 }));
    dispatch(fetchGateEntries({ limit: 500 }));
  };

  useEffect(() => { refresh(); }, [dispatch]); // eslint-disable-line

  const pending = useMemo(
    () => inquiries.filter((i) => i.status === "new" || !i.status).length,
    [inquiries]
  );
  const todayCalls = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((l) => l.callTime && new Date(l.callTime).toDateString() === today).length;
  }, [logs]);

  const recentEntries = entries.slice(0, 6);

  const columns = [
    {
      title: "Visitor",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={r.name || "?"} color={VISITOR_COLORS[r.type] || "#6366f1"} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name || "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.phone || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type", dataIndex: "type", width: 110,
      render: (v) => {
        const c = VISITOR_COLORS[v] || "#8b5cf6";
        return <span style={pill(c, `${c}15`)}>{v || "Visitor"}</span>;
      },
    },
    {
      title: "Entry", dataIndex: "entryTime", width: 90,
      render: (v) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(v)}</span>,
    },
    {
      title: "Status", dataIndex: "status", width: 100,
      render: (v) => {
        const inside = v === "Inside";
        return <span style={pill(inside ? "#10b981" : "#94a3b8", inside ? "#10b98115" : "#94a3b815")}>
          {v || "—"}
        </span>;
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("dash-table")}</style>
      <PageHeader
        title="Receptionist Dashboard"
        subtitle="Front desk overview — visitors, enquiries, calls and broadcasts"
        icon={<LayoutDashboard size={20} />}
        extra={<RefreshBtn onClick={refresh} />}
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={Users}       label="Today's Visitors"   value={stats?.todayEntries ?? 0} color="#6366f1" loading={loading} />
        <StatCard icon={HelpCircle}  label="Pending Enquiries"  value={pending}                  color="#f59e0b" loading={loading} />
        <StatCard icon={Phone}       label="Calls Today"        value={todayCalls}               color="#10b981" loading={loading} />
        <StatCard icon={CheckCircle} label="Currently Inside"   value={stats?.inside ?? 0}       color="#0ea5e9" loading={loading} />
      </div>

      <div style={sectionPanel}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Recent Visitor Entries
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}><Spin /></div>
        ) : recentEntries.length === 0 ? (
          <div style={emptyState}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🚪</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>No visitors yet today</div>
          </div>
        ) : (
          <Table className="dash-table" rowKey="_id" dataSource={recentEntries} columns={columns} pagination={false} size="small" />
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;

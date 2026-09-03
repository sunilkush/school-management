import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, DatePicker, Modal, Spin, Table, Tooltip, message } from "antd";
import {
  CheckCircleFilled, ExclamationCircleFilled, ReloadOutlined, SyncOutlined,
} from "@ant-design/icons";
import { fetchReconciliation, runPostPending } from "../../../features/ledgerSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Reconciliation = () => {
  const dispatch = useDispatch();
  const { reconciliation, reconciliationLoading, actionLoading } = useSelector((s) => s.ledger || {});

  const [range, setRange] = useState([]);
  const [problems, setProblems] = useState(null);

  const params = () =>
    range?.length === 2
      ? { from: range[0].startOf("day").toISOString(), to: range[1].endOf("day").toISOString() }
      : {};

  const load = () => dispatch(fetchReconciliation(params()));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, range]);

  const sweep = async () => {
    const res = await dispatch(runPostPending(params()));
    if (!runPostPending.fulfilled.match(res)) {
      message.error(res.payload || "Could not post the pending entries");
      return;
    }
    const { posted, problems: failed } = res.payload || {};
    message.success(posted ? `${posted} entr${posted === 1 ? "y" : "ies"} posted` : "Nothing left to post");
    if (failed?.length) setProblems(failed);
    load();
  };

  const fullyPosted = reconciliation?.isFullyPosted;

  const columns = [
    { title: "Source", dataIndex: "label", render: (label, r) => <span title={r.source}>{label}</span> },
    { title: "Records", dataIndex: "total", align: "right", width: 110 },
    { title: "In the books", dataIndex: "posted", align: "right", width: 130 },
    {
      title: "Not posted", dataIndex: "unposted", align: "right", width: 130,
      render: (v) => (v ? <span style={pill("var(--danger)")}>{v}</span> : <span style={{ color: "var(--text-muted)" }}>0</span>),
    },
    {
      title: "Value not posted", dataIndex: "unpostedValue", align: "right", width: 180,
      render: (v) => (v ? <b style={{ color: "var(--danger)" }}>{money(v)}</b> : "—"),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("recon-table")}</style>

      <PageHeader
        title="Reconciliation"
        subtitle="Money the system recorded, checked against what is actually in the ledger"
        icon={<SyncOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RangePicker value={range} onChange={(v) => setRange(v || [])} />
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={load} />
            </Tooltip>
            <Button
              type="primary" icon={<SyncOutlined />} loading={actionLoading}
              disabled={fullyPosted} onClick={sweep}
            >
              Post pending
            </Button>
          </div>
        }
      />

      {reconciliationLoading ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : (
        <>
          <div
            style={{
              ...sectionPanel, display: "flex", alignItems: "center", gap: 16,
              borderColor: fullyPosted ? "var(--success)" : "var(--warning)",
            }}
          >
            {fullyPosted ? (
              <CheckCircleFilled style={{ fontSize: 32, color: "var(--success)" }} />
            ) : (
              <ExclamationCircleFilled style={{ fontSize: 32, color: "var(--warning)" }} />
            )}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                {fullyPosted
                  ? "Every recorded money event is in the ledger"
                  : `${reconciliation?.totalUnposted || 0} money event(s) are not in the ledger yet`}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {fullyPosted
                  ? "The statements can be trusted as they stand."
                  : "Until these are posted, the trial balance and the statements understate the real position."}
              </div>
            </div>
          </div>

          <div style={sectionPanel}>
            <div style={tableContainer}>
              <Table
                className="recon-table"
                rowKey="source"
                size="middle"
                pagination={false}
                columns={columns}
                dataSource={reconciliation?.sources || []}
              />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Only settled money counts: a pending fee payment or an unpaid expense is not a book
              entry yet, and salaries appear once the payroll run has actually been disbursed.
            </p>
          </div>
        </>
      )}

      <Modal
        open={!!problems}
        title="Some events could not be posted"
        onCancel={() => setProblems(null)}
        footer={[<Button key="ok" type="primary" onClick={() => setProblems(null)}>Close</Button>]}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="These are still counted as unposted"
          description="They are not skipped quietly — fix the cause below and run the sweep again."
        />
        <Table
          rowKey={(r, i) => i}
          size="small"
          pagination={false}
          dataSource={problems || []}
          columns={[
            { title: "Source", dataIndex: "source", width: 130 },
            { title: "Reason", dataIndex: "reason" },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Reconciliation;

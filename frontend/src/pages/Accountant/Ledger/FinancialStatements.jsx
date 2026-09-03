import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, DatePicker, Spin, Table, Tabs, Tooltip } from "antd";
import { FundOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchBalanceSheet, fetchProfitAndLoss, fetchTrialBalance } from "../../../features/ledgerSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../../styles/pageStyles";

const { RangePicker } = DatePicker;

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const codeName = (r) => (
  <span>
    <span style={{ fontFamily: "monospace", color: "var(--text-muted)", marginRight: 8 }}>{r.code}</span>
    {r.name}
  </span>
);

/** A total row rendered outside the table so it survives paging and sorting. */
const TotalRow = ({ label, value, strong, tone }) => (
  <div
    style={{
      display: "flex", justifyContent: "space-between", padding: "12px 16px",
      borderTop: "1px solid var(--border-muted)",
      fontWeight: strong ? 800 : 600,
      color: tone || "var(--text-primary)",
      fontSize: strong ? 15 : 14,
    }}
  >
    <span>{label}</span>
    <span>{money(value)}</span>
  </div>
);

const Section = ({ title, rows, total, totalLabel }) => (
  <div style={sectionPanel}>
    <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
      {title}
    </h3>
    <div style={tableContainer}>
      <Table
        className="stmt-table"
        rowKey="accountId"
        size="small"
        pagination={false}
        dataSource={rows || []}
        locale={{ emptyText: "Nothing posted" }}
        columns={[
          { title: "Account", render: (_, r) => codeName(r) },
          { title: "Amount", dataIndex: "balance", align: "right", width: 160, render: (v) => money(v) },
        ]}
      />
      <TotalRow label={totalLabel} value={total} strong />
    </div>
  </div>
);

const FinancialStatements = () => {
  const dispatch = useDispatch();
  const { trialBalance, profitAndLoss, balanceSheet, statementLoading } = useSelector((s) => s.ledger || {});

  const [tab, setTab] = useState("trial");
  const [range, setRange] = useState([dayjs().startOf("year"), dayjs()]);
  const [asOf, setAsOf] = useState(dayjs());

  const rangeParams = () =>
    range?.length === 2
      ? { from: range[0].startOf("day").toISOString(), to: range[1].endOf("day").toISOString() }
      : {};

  const load = () => {
    if (tab === "trial") dispatch(fetchTrialBalance(rangeParams()));
    if (tab === "pl") dispatch(fetchProfitAndLoss(rangeParams()));
    if (tab === "bs") dispatch(fetchBalanceSheet({ asOf: asOf.endOf("day").toISOString() }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, tab, range, asOf]);

  const balanceBadge = (ok) => (
    <span style={pill(ok ? "var(--success)" : "var(--danger)")}>
      {ok ? "Balanced" : <><WarningOutlined /> Does not balance</>}
    </span>
  );

  const trialTab = (
    <>
      <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span><span style={{ color: "var(--text-muted)" }}>Total debits </span><b>{money(trialBalance?.totalDebit)}</b></span>
          <span><span style={{ color: "var(--text-muted)" }}>Total credits </span><b>{money(trialBalance?.totalCredit)}</b></span>
        </div>
        {trialBalance && balanceBadge(trialBalance.isBalanced)}
      </div>

      <div style={tableContainer}>
        <Table
          className="stmt-table"
          rowKey="accountId"
          size="middle"
          pagination={false}
          dataSource={trialBalance?.rows || []}
          locale={{ emptyText: "No posted entries in this period" }}
          columns={[
            { title: "Account", render: (_, r) => codeName(r) },
            { title: "Type", dataIndex: "type", width: 120 },
            { title: "Debit", dataIndex: "debit", align: "right", width: 150, render: (v) => (v ? money(v) : "—") },
            { title: "Credit", dataIndex: "credit", align: "right", width: 150, render: (v) => (v ? money(v) : "—") },
          ]}
        />
      </div>
    </>
  );

  const plTab = (
    <>
      <Section title="Income" rows={profitAndLoss?.income} total={profitAndLoss?.totalIncome} totalLabel="Total income" />
      <Section title="Expenditure" rows={profitAndLoss?.expense} total={profitAndLoss?.totalExpense} totalLabel="Total expenditure" />
      <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>{(profitAndLoss?.surplus ?? 0) >= 0 ? "Surplus" : "Deficit"}</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: (profitAndLoss?.surplus ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }}>
          {money(Math.abs(profitAndLoss?.surplus || 0))}
        </span>
      </div>
    </>
  );

  const bsTab = (
    <>
      {balanceSheet && (
        <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-muted)" }}>As at {asOf.format("D MMM YYYY")}</span>
          {balanceBadge(balanceSheet.isBalanced)}
        </div>
      )}
      <Section title="Assets" rows={balanceSheet?.assets} total={balanceSheet?.totalAssets} totalLabel="Total assets" />
      <Section title="Liabilities" rows={balanceSheet?.liabilities} total={balanceSheet?.totalLiabilities} totalLabel="Total liabilities" />
      <div style={sectionPanel}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
          Equity
        </h3>
        <div style={tableContainer}>
          <Table
            className="stmt-table"
            rowKey="accountId"
            size="small"
            pagination={false}
            dataSource={balanceSheet?.equity || []}
            locale={{ emptyText: "Nothing posted" }}
            columns={[
              { title: "Account", render: (_, r) => codeName(r) },
              { title: "Amount", dataIndex: "balance", align: "right", width: 160, render: (v) => money(v) },
            ]}
          />
          {/* Income and expense are never closed into equity, so the period result has to be
              carried onto the sheet explicitly — without it the two sides would never agree. */}
          <TotalRow label="Surplus for the period" value={balanceSheet?.currentPeriodSurplus} />
          <TotalRow label="Total liabilities and equity" value={balanceSheet?.totalLiabilitiesAndEquity} strong />
        </div>
      </div>
    </>
  );

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("stmt-table")}</style>

      <PageHeader
        title="Financial Statements"
        subtitle="Built from posted entries only — drafts are never counted"
        icon={<FundOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tab === "bs" ? (
              <DatePicker value={asOf} onChange={(d) => setAsOf(d || dayjs())} />
            ) : (
              <RangePicker value={range} onChange={(v) => setRange(v || [])} />
            )}
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={load} />
            </Tooltip>
          </div>
        }
      />

      {statementLoading ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : (
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            { key: "trial", label: "Trial Balance", children: trialTab },
            { key: "pl", label: "Income & Expenditure", children: plTab },
            { key: "bs", label: "Balance Sheet", children: bsTab },
          ]}
        />
      )}
    </div>
  );
};

export default FinancialStatements;

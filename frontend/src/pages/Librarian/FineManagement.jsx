import React, { useEffect, useMemo, useState } from "react";
import {
  Button, Col, Empty, Input, Modal, Popconfirm, Row,
  Select, Spin, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  CheckCircleOutlined, CloseCircleOutlined, DollarOutlined,
  SearchOutlined, FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  collectLibraryFine, fetchFineSummary, fetchIssuedBooks,
} from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import {
  iconWell, pageWrapper, sectionPanel, statGrid, tableHeadCss,
} from "../../styles/pageStyles";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FineManagement = () => {
  const dispatch = useDispatch();
  const { issuedBooks = [], fines, finesLoading, issuedLoading, actionLoading } = useSelector((s) => s.library || {});

  /* ── filters ─────────────────────────────────────────────────────── */
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");

  /* ── waive modal ─────────────────────────────────────────────────── */
  const [waiveModal, setWaiveModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [waiveNote, setWaiveNote] = useState("");

  useEffect(() => {
    dispatch(fetchIssuedBooks());
    dispatch(fetchFineSummary());
  }, [dispatch]);

  /* ── fine records (only issued books with fine > 0) ─────────────── */
  const fineRows = useMemo(() => {
    return issuedBooks
      .filter((ib) => ib.fine > 0)
      .map((ib) => ({
        key:        ib._id,
        _id:        ib._id,
        borrowerName: ib.borrowerName || ib.studentName || ib.issuedToUserId?.name || "Unknown",
        memberType: ib.memberType || "Student",
        bookTitle:  ib.bookId?.title || "Unknown",
        status:     ib.status,
        fine:       ib.fine,
        fineStatus: ib.fineStatus || "Pending",
        fineNote:   ib.fineNote || "",
        dueDate:    ib.dueDate ? dayjs(ib.dueDate).format("DD MMM YYYY") : "-",
        returnDate: ib.returnDate ? dayjs(ib.returnDate).format("DD MMM YYYY") : "-",
        overdueDays: ib.dueDate
          ? Math.max(0, dayjs().diff(dayjs(ib.dueDate), "day"))
          : 0,
      }));
  }, [issuedBooks]);

  /* ── filtered ────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return fineRows.filter((r) => {
      if (statusFilter !== "All" && r.fineStatus !== statusFilter) return false;
      const q = searchText.toLowerCase();
      return !q || r.borrowerName.toLowerCase().includes(q) || r.bookTitle.toLowerCase().includes(q);
    });
  }, [fineRows, statusFilter, searchText]);

  /* ── summary from slice or computed ─────────────────────────────── */
  const summary = useMemo(() => {
    if (fines?.summary) return fines.summary;
    return {
      totalPending:   fineRows.filter((r) => r.fineStatus === "Pending").reduce((s, r) => s + r.fine, 0),
      totalCollected: fineRows.filter((r) => r.fineStatus === "Paid").reduce((s, r) => s + r.fine, 0),
      totalWaived:    fineRows.filter((r) => r.fineStatus === "Waived").reduce((s, r) => s + r.fine, 0),
      totalRecords:   fineRows.length,
    };
  }, [fines, fineRows]);

  /* ── mark paid ───────────────────────────────────────────────────── */
  const handlePaid = async (record) => {
    try {
      await dispatch(collectLibraryFine({ id: record._id, action: "paid", note: "" })).unwrap();
      message.success("Fine marked as paid");
      dispatch(fetchIssuedBooks());
      dispatch(fetchFineSummary());
    } catch (e) {
      message.error(e || "Unable to update fine");
    }
  };

  /* ── waive ───────────────────────────────────────────────────────── */
  const openWaive = (record) => {
    setSelectedRecord(record);
    setWaiveNote("");
    setWaiveModal(true);
  };

  const handleWaive = async () => {
    try {
      await dispatch(collectLibraryFine({ id: selectedRecord._id, action: "waive", note: waiveNote })).unwrap();
      message.success("Fine waived");
      setWaiveModal(false);
      setSelectedRecord(null);
      dispatch(fetchIssuedBooks());
      dispatch(fetchFineSummary());
    } catch (e) {
      message.error(e || "Unable to waive fine");
    }
  };

  /* ── columns ─────────────────────────────────────────────────────── */
  const columns = [
    {
      title: "Borrower",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.borrowerName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.memberType}</div>
        </div>
      ),
    },
    {
      title: "Book",
      dataIndex: "bookTitle",
      render: (t) => <Text style={{ fontWeight: 500 }}>{t}</Text>,
    },
    {
      title: "Due / Return",
      width: 120,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12 }}>Due: <span style={{ color: "#EF4444", fontWeight: 600 }}>{r.dueDate}</span></div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Returned: {r.returnDate}</div>
        </div>
      ),
    },
    {
      title: "Book Status",
      dataIndex: "status",
      width: 100,
      render: (s) => {
        const map = { Issued: "orange", Returned: "green", Overdue: "red", Lost: "purple" };
        return <Tag color={map[s] || "default"}>{s}</Tag>;
      },
    },
    {
      title: "Fine Amount",
      dataIndex: "fine",
      width: 110,
      sorter: (a, b) => a.fine - b.fine,
      render: (f) => <span style={{ fontWeight: 700, fontSize: 15, color: "#EF4444" }}>₹{f}</span>,
    },
    {
      title: "Fine Status",
      dataIndex: "fineStatus",
      width: 110,
      render: (s) => {
        const map = { Pending: { color: "red" }, Paid: { color: "green" }, Waived: { color: "default" } };
        return <Tag color={map[s]?.color || "default"}>{s}</Tag>;
      },
    },
    {
      title: "Actions",
      width: 160,
      render: (_, r) => {
        if (r.fineStatus !== "Pending") {
          return <Text type="secondary" style={{ fontSize: 12 }}>{r.fineNote || "—"}</Text>;
        }
        return (
          <div style={{ display: "flex", gap: 6 }}>
            <Tooltip title="Mark as Paid">
              <Popconfirm title={`Mark ₹${r.fine} fine as paid?`} onConfirm={() => handlePaid(r)} okText="Paid" cancelText="No">
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={actionLoading}>
                  Paid
                </Button>
              </Popconfirm>
            </Tooltip>
            <Tooltip title="Waive Fine">
              <Button size="small" icon={<CloseCircleOutlined />} onClick={() => openWaive(r)}>
                Waive
              </Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("fine-tbl")}</style>
      <PageHeader
        title="Fine Management"
        subtitle="Collect, waive, and track library fines"
        icon={<DollarOutlined />}
      />

      {/* ── Summary KPIs ──────────────────────────────────────────── */}
      <div style={statGrid(150)}>
        {[
          { label: "Total Records",    value: summary.totalRecords,   color: "#0891b2", icon: <FilterOutlined /> },
          { label: "Pending Fines",    value: `₹${summary.totalPending}`,   color: "#EF4444", icon: <DollarOutlined /> },
          { label: "Collected",        value: `₹${summary.totalCollected}`, color: "#22C55E", icon: <CheckCircleOutlined /> },
          { label: "Waived",           value: `₹${summary.totalWaived}`,    color: "#64748B", icon: <CloseCircleOutlined /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 0 }}>
            <div style={iconWell(color, 40)}>{icon}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{value ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters + Table ──────────────────────────────────────────── */}
      <div style={sectionPanel}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search borrower or book..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
            <Option value="All">All Fines</Option>
            <Option value="Pending">Pending</Option>
            <Option value="Paid">Paid</Option>
            <Option value="Waived">Waived</Option>
          </Select>
        </div>

        {finesLoading || issuedLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <Table
            className="fine-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={filtered}
            loading={actionLoading}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 900 }}
            locale={{ emptyText: <Empty description={statusFilter === "Pending" ? "No pending fines" : "No fine records"} /> }}
            size="small"
          />
        )}
      </div>

      {/* ── Waive modal ───────────────────────────────────────────────── */}
      <Modal
        title="Waive Fine"
        open={waiveModal}
        onCancel={() => { setWaiveModal(false); setSelectedRecord(null); }}
        onOk={handleWaive}
        okText="Waive Fine"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading}
        destroyOnClose
      >
        {selectedRecord && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...sectionPanel, padding: 14, marginBottom: 0 }}>
              <div style={{ fontWeight: 700 }}>{selectedRecord.bookTitle}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Borrower: <strong>{selectedRecord.borrowerName}</strong>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginTop: 8 }}>₹{selectedRecord.fine}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Reason for waiver (optional)</div>
              <TextArea
                value={waiveNote}
                onChange={(e) => setWaiveNote(e.target.value)}
                placeholder="e.g., Medical emergency, scholarship student..."
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FineManagement;

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
} from "antd";
import { ReloadOutlined, FileTextOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";
import { fetchReports } from "../../../features/reportSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid,
  tableContainer, tableHeadCss, toolbarRow,
} from "../../../styles/pageStyles";

const normalizeUserContext = (rawUser) => {
  const roleName =
    (typeof rawUser?.role === "string" ? rawUser?.role : rawUser?.role?.name) ||
    "";

  return {
    role: roleName,
    teacherId: rawUser?._id || "",
    schoolId: rawUser?.school?._id || rawUser?.schoolId || "",
    teacherName: rawUser?.name || "Teacher",
  };
};

const TeacherReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { summary = [], loading: summaryLoading, error: summaryError } = useSelector(
    (state) => state.dashboard || {}
  );
  const { items = [], loading: reportsLoading, error: reportsError } = useSelector(
    (state) => state.reports || {}
  );

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const { role, teacherId, schoolId, teacherName } = useMemo(
    () => normalizeUserContext(user),
    [user]
  );

  const refreshAll = () => {
    if (role) {
      dispatch(fetchDashboardSummary({ role, schoolId }));
    }
    dispatch(fetchReports({ sort: "-createdAt", school: schoolId, generatedBy: teacherId }));
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, schoolId]);

  const filteredReports = useMemo(() => {
    const bySearch = String(searchText || "").trim().toLowerCase();

    return items.filter((report) => {
      const matchesType = selectedType === "all" || report?.type === selectedType;
      if (!matchesType) return false;

      if (!bySearch) return true;
      const searchableText = [
        report?.title,
        report?.type,
        report?.generatedBy?.name,
        report?.school?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(bySearch);
    });
  }, [items, searchText, selectedType]);

  const reportTypeOptions = useMemo(() => {
    const types = new Set(items.map((item) => item?.type).filter(Boolean));
    return [
      { label: "All types", value: "all" },
      ...[...types].map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      })),
    ];
  }, [items]);

  const tableColumns = [
    {
      title: "Report Title",
      dataIndex: "title",
      key: "title",
      render: (value) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value || "Untitled report"}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (value) => (
        <Tag color="blue" style={{ textTransform: "capitalize" }}>
          {value || "unknown"}
        </Tag>
      ),
    },
    {
      title: "Created By",
      dataIndex: ["generatedBy", "name"],
      key: "generatedBy",
      render: (value) => value || "-",
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
  ];

  const cards = [
    {
      title: "Linked Students",
      value: summary.find((item) => item.title === "Students")?.value || 0,
    },
    {
      title: "Attendance Marked",
      value: summary.find((item) => item.title === "Attendance Marked")?.value || 0,
    },
    {
      title: "Reports Available",
      value: items.length,
    },
  ];

  return (
    <>
      <PageHeader
        title={`${teacherName} - Reports Dashboard`}
        subtitle="This page is now fully dynamic and loads reports + summary in real-time"
        icon={<FileTextOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refreshAll}>
            Refresh
          </Button>
        }
      />
      <div style={pageWrapper}>
        {summaryError && <Alert type="error" showIcon message={summaryError} style={{ marginBottom: 16 }} />}
        {reportsError && <Alert type="error" showIcon message={reportsError} style={{ marginBottom: 16 }} />}

        <div style={statGrid(200)}>
          {cards.map((card) => (
            <div key={card.title} style={{ ...sectionPanel, marginBottom: 0 }}>
              <Statistic title={card.title} value={card.value} loading={summaryLoading} />
            </div>
          ))}
        </div>

        <style>{tableHeadCss("teacher-reports-tbl")}</style>

        <div style={sectionPanel}>
          <div style={toolbarRow}>
            <Input.Search
              placeholder="Search by title, type, creator"
              allowClear
              style={{ width: 280 }}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            <Select
              style={{ width: 180 }}
              options={reportTypeOptions}
              value={selectedType}
              onChange={setSelectedType}
            />
          </div>

          {reportsLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
            </div>
          ) : filteredReports.length === 0 ? (
            <Empty description="No reports matched your filters" />
          ) : (
            <div className="teacher-reports-tbl" style={tableContainer}>
              <Table
                rowKey={(record) => record._id}
                columns={tableColumns}
                dataSource={filteredReports}
                pagination={{ pageSize: 8 }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherReports;

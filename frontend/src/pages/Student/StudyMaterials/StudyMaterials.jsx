import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Input, Select, Tag, Space, Empty, Spin, message,
} from "antd";
import {
  BookOutlined, SearchOutlined, LinkOutlined, FileTextOutlined, VideoCameraOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import apiClient from "../../../api/httpClient";
import { fetchStudentEnrollment } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell, toolbarRow } from "../../../styles/pageStyles";

const TYPE_OPTIONS = [
  { value: "notes",          label: "Notes",          icon: <FileTextOutlined /> },
  { value: "book",           label: "Book",            icon: <BookOutlined /> },
  { value: "video",          label: "Video",           icon: <VideoCameraOutlined /> },
  { value: "assignment",     label: "Assignment",      icon: <FileTextOutlined /> },
  { value: "question_paper", label: "Question Paper",  icon: <FileTextOutlined /> },
  { value: "other",          label: "Other",           icon: <FileTextOutlined /> },
];

const TYPE_COLOR = {
  notes: "blue", book: "purple", video: "cyan", assignment: "orange", question_paper: "red", other: "default",
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const MaterialCard = ({ item }) => {
  const typeInfo = TYPE_OPTIONS.find((t) => t.value === item.type) || TYPE_OPTIONS[5];

  return (
    <div style={{
      ...sectionPanel,
      padding: "16px 20px",
      marginBottom: 0,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      transition: "box-shadow 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>{item.title}</div>
          <Space wrap size={6}>
            <Tag color={TYPE_COLOR[item.type] || "default"}>{typeInfo.label}</Tag>
            {item.subjectId?.name && <Tag color="geekblue">{item.subjectId.name}</Tag>}
          </Space>
          {item.description && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{item.description}</div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            By {item.uploadedBy?.name || "Teacher"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {item.fileUrl && (
            <Button
              size="small" type="primary" icon={<DownloadOutlined />}
              href={item.fileUrl} target="_blank" rel="noreferrer"
            >
              Download
            </Button>
          )}
          {item.externalLink && (
            <Button
              size="small" icon={<LinkOutlined />}
              href={item.externalLink} target="_blank" rel="noreferrer"
            >
              Open Link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const StudyMaterials = () => {
  const dispatch = useDispatch();
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const studentPortal = useSelector((s) => s.studentPortal || {});
  const enrollment = studentPortal.enrollment;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [query, setQuery]         = useState("");
  const [filterSubject, setFilterSubject] = useState(undefined);
  const [filterType, setFilterType]       = useState(undefined);

  useEffect(() => {
    if (!enrollment) dispatch(fetchStudentEnrollment());
  }, [dispatch, enrollment]);

  const fetchMaterials = useCallback(async () => {
    if (!selectedAcademicYear?._id || !enrollment?.schoolClass) return;
    setLoading(true);
    try {
      const params = {
        academicYearId: selectedAcademicYear._id,
        schoolClassId: typeof enrollment.schoolClass === "object"
          ? enrollment.schoolClass._id
          : enrollment.schoolClass,
      };
      const res = await apiClient.get("/study-materials", { params });
      setMaterials(res.data?.data?.items || []);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load study materials");
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear?._id, enrollment?.schoolClass]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const subjects = useMemo(() => {
    const map = new Map();
    materials.forEach((m) => {
      const id = m.subjectId?._id;
      const name = m.subjectId?.name;
      if (id && name && !map.has(id)) map.set(id, { value: id, label: name });
    });
    return Array.from(map.values());
  }, [materials]);

  const filtered = useMemo(() => {
    const kw = query.trim().toLowerCase();
    return materials.filter((m) => {
      const matchSearch = !kw || m.title.toLowerCase().includes(kw) || (m.subjectId?.name || "").toLowerCase().includes(kw);
      const matchSubject = !filterSubject || m.subjectId?._id === filterSubject;
      const matchType    = !filterType    || m.type === filterType;
      return matchSearch && matchSubject && matchType;
    });
  }, [materials, query, filterSubject, filterType]);

  const stats = useMemo(() => ({
    total:  materials.length,
    notes:  materials.filter((m) => m.type === "notes").length,
    videos: materials.filter((m) => m.type === "video").length,
    books:  materials.filter((m) => m.type === "book").length,
  }), [materials]);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Study Materials"
        subtitle="Browse resources uploaded by your teachers"
        icon={<BookOutlined />}
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<BookOutlined />}       label="Total"  value={stats.total}  color="var(--accent)" />
        <StatCard icon={<FileTextOutlined />}   label="Notes"  value={stats.notes}  color="var(--cyan)" />
        <StatCard icon={<VideoCameraOutlined />} label="Videos" value={stats.videos} color="var(--success)" />
        <StatCard icon={<BookOutlined />}        label="Books"  value={stats.books}  color="var(--warning)" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div style={toolbarRow}>
          <Input
            placeholder="Search by title or subject"
            prefix={<SearchOutlined />}
            value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 280 }} allowClear
          />
          <Select
            placeholder="Filter by Subject" style={{ width: 180 }} allowClear
            value={filterSubject} onChange={setFilterSubject} options={subjects}
          />
          <Select
            placeholder="Filter by Type" style={{ width: 160 }} allowClear
            value={filterType} onChange={setFilterType} options={TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="No study materials found" style={{ padding: 40 }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item) => <MaterialCard key={item._id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;

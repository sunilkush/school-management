import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { Select, Spin, Table, Empty, Input } from "antd";
import {
  ApartmentOutlined, CalendarOutlined, SearchOutlined,
  TeamOutlined, BookOutlined, UserOutlined, SolutionOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import { statGrid, iconWell, pill } from "../../../styles/pageStyles";

const enrolledCount = (sec) =>
  sec.studentEnrollmentIds?.length || sec.StudentEnrollmentId?.length || 0;

const StatCard = ({ icon, label, value, color }) => (
  <div className="section-panel is-header-strip">
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div className="u-title-lg">{value}</div>
    </div>
  </div>
);

const SchoolClassSectionFilter = () => {
  const dispatch = useDispatch();

  const { schools = [], loading: schoolLoading } = useSelector((state) => state.school);
  const { classList = [], loading: classLoading } = useSelector((state) => state.class || {});
  const { sections = [], loading: sectionLoading } = useSelector((state) => state.section);
  const { activeYear, loading: yearLoading } = useSelector((state) => state.academicYear || {});

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");

  // Load all schools on mount
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchAllClasses());
  }, [dispatch]);

  // When school changes, fetch its classes & active academic year
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchAllClasses({ schoolId: selectedSchool }));
      dispatch(fetchActiveAcademicYear(selectedSchool));
      setSelectedClass(null);
    }
  }, [selectedSchool, dispatch]);

  // activeYear belongs to the currently selected school?
  const activeYearForSchool =
    activeYear && String(activeYear.schoolId?._id || activeYear.schoolId) === String(selectedSchool)
      ? activeYear
      : null;

  // Once we know the school's active academic year, fetch sections scoped to it
  useEffect(() => {
    if (selectedSchool && activeYearForSchool?._id) {
      dispatch(fetchSections({ schoolId: selectedSchool, academicYearId: activeYearForSchool._id }));
    }
  }, [selectedSchool, activeYearForSchool?._id, dispatch]);

  // Filter sections based on selected class + search
  const filteredSections = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return sections.filter((sec) => {
      const matchClass = !selectedClass || String(sec.schoolClassId?._id) === String(selectedClass);
      const matchSearch =
        !keyword ||
        sec.schoolClassId?.name?.toLowerCase().includes(keyword) ||
        sec.name?.toLowerCase().includes(keyword) ||
        sec.classTeacherId?.name?.toLowerCase().includes(keyword);
      return matchClass && matchSearch;
    });
  }, [sections, selectedClass, search]);

  const stats = useMemo(() => {
    const totalClasses = new Set(filteredSections.map((s) => s.schoolClassId?._id).filter(Boolean)).size;
    const totalCapacity = filteredSections.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalEnrolled = filteredSections.reduce((sum, s) => sum + enrolledCount(s), 0);
    return { totalClasses, totalSections: filteredSections.length, totalCapacity, totalEnrolled };
  }, [filteredSections]);

  const columns = [
    {
      title: "#",
      key: "idx",
      width: 50,
      render: (_, __, i) => (
        <span className="u-meta">{i + 1}</span>
      ),
    },
    {
      title: "Class",
      dataIndex: ["schoolClassId", "name"],
      render: (name) => <span className="u-strong-bold">{name || "N/A"}</span>,
    },
    {
      title: "Section",
      dataIndex: "name",
      render: (name) => <span style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>{name}</span>,
    },
    {
      title: "Class Teacher",
      dataIndex: ["classTeacherId", "name"],
      render: (name) => name
        ? <span style={{ color: "var(--text-primary)" }}><UserOutlined style={{ color: "var(--text-muted)", marginRight: 6 }} />{name}</span>
        : <span className="u-meta">Not assigned</span>,
    },
    {
      title: "Enrollment",
      key: "enrollment",
      render: (_, sec) => {
        const enrolled = enrolledCount(sec);
        const capacity = sec.capacity || 0;
        const ratio = capacity ? enrolled / capacity : 0;
        const color = ratio >= 1 ? "var(--danger-hover)" : ratio >= 0.8 ? "var(--warning-hover)" : "var(--success-hover)";
        const bg = ratio >= 1 ? "rgba(254,226,226,0.5)" : ratio >= 0.8 ? "rgba(254,243,199,0.5)" : "rgba(220,252,231,0.5)";
        return <span style={pill(color, bg)}>{enrolled} / {capacity || "—"}</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, sec) => {
        const isActive = status ? status === "active" : sec.isActive;
        return isActive
          ? <span style={pill("var(--success-hover)", "rgba(220,252,231,0.5)")}>Active</span>
          : <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}>Inactive</span>;
      },
    },
  ];

  const tableData = filteredSections.map((sec) => ({ ...sec, key: sec._id }));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Class & Section Explorer"
        subtitle="Select a school to explore its classes, sections, teachers and enrollment"
        icon={<ApartmentOutlined />}
      />

      <div className="section-panel u-mt-5">
        <div className="toolbar-row">
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Select School</div>
            <Select
              placeholder="Choose School"
              loading={schoolLoading}
              className="u-full"
              onChange={(value) => setSelectedSchool(value)}
              value={selectedSchool}
              allowClear
            >
              {schools.map((s) => (
                <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Select Class</div>
            {classLoading ? (
              <Spin />
            ) : (
              <Select
                placeholder="Choose Class"
                disabled={!selectedSchool}
                className="u-full"
                onChange={(value) => setSelectedClass(value)}
                value={selectedClass}
                allowClear
              >
                {classList.map((c) => (
                  <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                ))}
              </Select>
            )}
          </div>

          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Search</div>
            <Input
              allowClear
              disabled={!selectedSchool}
              prefix={<SearchOutlined className="u-muted" />}
              placeholder="Search by class, section or teacher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {selectedSchool && (
        <div style={{ ...statGrid(170), marginTop: 20 }}>
          <StatCard icon={<BookOutlined />} label="Classes" value={stats.totalClasses} color="var(--primary)" />
          <StatCard icon={<ApartmentOutlined />} label="Sections" value={stats.totalSections} color="var(--purple)" />
          <StatCard icon={<TeamOutlined />} label="Total Capacity" value={stats.totalCapacity} color="var(--accent)" />
          <StatCard icon={<SolutionOutlined />} label="Enrolled Students" value={stats.totalEnrolled} color="var(--warning)" />
        </div>
      )}


      <div className="section-panel u-mt-5">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span className="u-title-sm">Sections</span>
          {selectedSchool && (
            yearLoading ? (
              <Spin size="small" />
            ) : activeYearForSchool ? (
              <span style={pill("var(--primary)", "rgba(219,234,254,0.4)")}>
                <CalendarOutlined style={{ marginRight: 5 }} />
                Active Year: {activeYearForSchool.name || activeYearForSchool.code}
              </span>
            ) : (
              <span style={pill("var(--danger-hover)", "rgba(254,226,226,0.5)")}>No active academic year set for this school</span>
            )
          )}
        </div>
        {sectionLoading ? (
          <Spin />
        ) : (
          <div className="class-section-tbl table-container">
            <Table
              columns={columns}
              dataSource={tableData}
              rowKey="key"
              pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 32] }}
              locale={{
                emptyText: (
                  <Empty
                    description={
                      !selectedSchool
                        ? "Select a school to view its classes & sections"
                        : !activeYearForSchool
                        ? "This school has no active academic year — set one to view its sections"
                        : "No sections found"
                    }
                  />
                ),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolClassSectionFilter;

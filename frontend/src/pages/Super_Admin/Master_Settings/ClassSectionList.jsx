<<<<<<< HEAD
import React, { useEffect, useState, useMemo } from "react";
=======
import React, { useEffect, useMemo, useState } from "react";
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
<<<<<<< HEAD
import { Select, Table, Spin, Input } from "antd";
import { Layers, School2, BookOpen, LayoutList, Search, ChevronRight, CalendarDays } from "lucide-react";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#6366F1";

const SchoolClassSectionFilter = () => {
  const dispatch = useDispatch();
  const { schools = [], loading: schoolLoading } = useSelector((s) => s.school);
  const { classList = [] } = useSelector((s) => s.class || {});
  const { activeYear } = useSelector((s) => s.academicYear || {});
=======
import { Select, Spin, Table, Empty, Input } from "antd";
import {
  ApartmentOutlined, CalendarOutlined, SearchOutlined,
  TeamOutlined, BookOutlined, UserOutlined, SolutionOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, toolbarRow,
  tableContainer, tableHeadCss, pill,
} from "../../../styles/pageStyles";

const enrolledCount = (sec) =>
  sec.studentEnrollmentIds?.length || sec.StudentEnrollmentId?.length || 0;

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

const SchoolClassSectionFilter = () => {
  const dispatch = useDispatch();

  const { schools, loading: schoolLoading } = useSelector((state) => state.school);
  const { classList = [], loading: classLoading } = useSelector((state) => state.class || {});
  const { sections, loading: sectionLoading } = useSelector((state) => state.section);
  const { activeYear, loading: yearLoading } = useSelector((state) => state.academicYear || {});
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");

<<<<<<< HEAD
  // All sections for selected school+activeYear — stored locally so class filter doesn't wipe it
  const [allSchoolSections, setAllSchoolSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [yearLoading, setYearLoading] = useState(false);

  // 1. Mount
=======
  // Load all schools on mount
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchAllClasses());
  }, [dispatch]);

<<<<<<< HEAD
  // 2. School change → fetch active year → fetch all sections for that school+year
  useEffect(() => {
    setSelectedClass(null);
    setSearch("");
    setAllSchoolSections([]);

    if (!selectedSchool) return;

    const load = async () => {
      setYearLoading(true);
      const yearAction = await dispatch(fetchActiveAcademicYear(selectedSchool));
      setYearLoading(false);

      const year = yearAction?.payload;
      const params = { schoolId: selectedSchool };
      if (year?._id) params.academicYearId = year._id;

      setSectionsLoading(true);
      const sectionsAction = await dispatch(fetchSections(params));
      setSectionsLoading(false);

      const fetched = sectionsAction?.payload;
      setAllSchoolSections(Array.isArray(fetched) ? fetched : []);
    };

    load();
  }, [selectedSchool, dispatch]);

  // Resolve class name from either populated object or plain string ID
  const resolveClassName = (sec) => {
    if (!sec.schoolClassId) return "N/A";
    if (typeof sec.schoolClassId === "object") return sec.schoolClassId.name || "N/A";
    return classList.find((c) => c._id === String(sec.schoolClassId))?.name || "N/A";
  };

  // Classes that have sections in this school+activeYear (derived from allSchoolSections)
  const classesInSchool = useMemo(() => {
    if (!selectedSchool || allSchoolSections.length === 0) return [];
    const classIdSet = new Set(
      allSchoolSections.map((sec) => {
        if (!sec.schoolClassId) return null;
        return typeof sec.schoolClassId === "object"
          ? sec.schoolClassId._id
          : sec.schoolClassId;
      }).filter(Boolean)
    );
    return classList.filter((c) => classIdSet.has(c._id));
  }, [allSchoolSections, classList, selectedSchool]);

  // Display sections — filter locally (no re-fetch, no Redux overwrite)
  const displaySections = useMemo(() => {
    let data = allSchoolSections;

    if (selectedClass) {
      data = data.filter((sec) => {
        const classId = typeof sec.schoolClassId === "object"
          ? sec.schoolClassId?._id
          : sec.schoolClassId;
        return String(classId) === String(selectedClass);
      });
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((sec) =>
        sec.name?.toLowerCase().includes(q) ||
        resolveClassName(sec).toLowerCase().includes(q)
      );
    }

    return data;
  }, [allSchoolSections, selectedClass, search]);

  const selectedSchoolName = schools.find((s) => s._id === selectedSchool)?.name || "";
  const selectedClassName = classList.find((c) => c._id === selectedClass)?.name || "";

  const tableData = displaySections.map((sec) => ({
    key: sec._id,
    className: resolveClassName(sec),
    sectionName: sec.name,
  }));
=======
  // When school changes, fetch its classes & active academic year
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchAllClasses({ schoolId: selectedSchool }));
      dispatch(fetchActiveAcademicYear(selectedSchool));
      setSelectedClass(null); // reset selected class
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
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d

  const columns = [
    {
      title: "#",
      key: "idx",
      width: 50,
      render: (_, __, i) => (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</span>
      ),
    },
    {
      title: "Class",
<<<<<<< HEAD
      dataIndex: "className",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={iconWell("#6366F1", 26)}>
            <BookOpen size={12} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{name}</span>
        </div>
      ),
    },
    {
      title: "Section",
      dataIndex: "sectionName",
      render: (name) => (
        <span style={pill("#14B8A6", "rgba(20,184,166,0.12)")}>{name}</span>
      ),
    },
  ];

  const isLoading = schoolLoading || sectionsLoading || yearLoading;

  return (
    <>
      <style>{tableHeadCss("classsection-tbl")}</style>
      <div style={pageWrapper}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={iconWell(ACCENT, 44)}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Classes & Sections
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Browse class-section mapping per school's active academic year
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedSchoolName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 12 }}>
            <School2 size={12} style={{ color: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{selectedSchoolName}</span>
            {selectedClassName && (
              <>
                <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{selectedClassName}</span>
              </>
            )}
          </div>
        )}

        {/* Active year banner */}
        {selectedSchool && !yearLoading && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: activeYear ? "rgba(99,102,241,0.06)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${activeYear ? "rgba(99,102,241,0.2)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: 10, padding: "9px 14px", marginBottom: 18,
          }}>
            <CalendarDays size={14} style={{ color: activeYear ? ACCENT : "#F59E0B", flexShrink: 0 }} />
            {activeYear
              ? (
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  Active Year: <strong>{activeYear.name || activeYear.year}</strong>
                  {activeYear.startDate && activeYear.endDate && (
                    <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 11 }}>
                      ({new Date(activeYear.startDate).getFullYear()} – {new Date(activeYear.endDate).getFullYear()})
                    </span>
                  )}
                  <span style={{ ...pill("#16A34A", "rgba(220,252,231,0.4)"), marginLeft: 10, fontSize: 11 }}>
                    Active
                  </span>
                </span>
              )
              : (
                <span style={{ fontSize: 13, color: "#B45309" }}>
                  No active academic year — showing all sections for this school
                </span>
              )}
          </div>
        )}

        {/* Stats */}
        {selectedSchool && (
          <div style={statGrid(160)}>
            {[
              { label: "Total Sections", value: allSchoolSections.length, color: ACCENT, icon: <Layers size={18} /> },
              { label: "Classes in School", value: classesInSchool.length, color: "#3B82F6", icon: <BookOpen size={18} /> },
              { label: "Showing", value: displaySections.length, color: "#14B8A6", icon: <LayoutList size={18} /> },
            ].map((s) => (
              <div key={s.label} style={statCard({ color: s.color, bg: "var(--surface)", accentBar: s.color })}>
                <div>
                  <div style={statLabel(s.color)}>{s.label}</div>
                  <div style={statValue(s.color)}>{s.value}</div>
                </div>
                <div style={iconWell(s.color, 40)}>{s.icon}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
            Filters
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>

            {/* School */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                School
              </div>
              <Select
                placeholder="Choose school..."
                loading={schoolLoading}
                style={{ width: "100%" }}
                onChange={(value) => setSelectedSchool(value ?? null)}
                value={selectedSchool}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {schools.map((s) => (
                  <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Class */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Class
              </div>
              {sectionsLoading
                ? <Spin size="small" style={{ display: "block", paddingTop: 8 }} />
                : (
                  <Select
                    placeholder={
                      !selectedSchool
                        ? "Select school first"
                        : classesInSchool.length === 0
                        ? "No classes found"
                        : "Choose class..."
                    }
                    disabled={!selectedSchool || classesInSchool.length === 0}
                    style={{ width: "100%" }}
                    onChange={(value) => setSelectedClass(value ?? null)}
                    value={selectedClass}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {classesInSchool.map((c) => (
                      <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                )}
            </div>

            {/* Search */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Search
              </div>
              <Input
                prefix={<Search size={13} style={{ color: "var(--text-muted)" }} />}
                placeholder="Search class or section..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedSchool}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </div>
          </div>
        </div>

        {/* Sections Table */}
        <div style={sectionPanel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Sections
              {selectedSchool && (
                <span style={{ ...pill(ACCENT, "rgba(99,102,241,0.1)"), fontSize: 11 }}>
                  {displaySections.length}
                </span>
              )}
            </div>
            {!selectedSchool && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Select a school to view sections
              </span>
            )}
          </div>

          <Spin spinning={!!isLoading}>
            <div className="classsection-tbl">
              <Table
                columns={columns}
                dataSource={tableData}
                rowKey="key"
                pagination={tableData.length > 15
                  ? { pageSize: 15, size: "small", showSizeChanger: false }
                  : false}
                locale={{
                  emptyText: (
                    <div style={emptyState}>
                      <Layers size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {!selectedSchool
                          ? "Select a school to view classes and sections"
                          : !activeYear
                          ? "No active academic year set for this school"
                          : selectedClass
                          ? "No sections found for this class"
                          : "No sections found for this school's active year"}
                      </div>
                    </div>
                  ),
                }}
              />
            </div>
          </Spin>
        </div>
=======
      dataIndex: ["schoolClassId", "name"],
      render: (name) => <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{name || "N/A"}</span>,
    },
    {
      title: "Section",
      dataIndex: "name",
      render: (name) => <span style={pill("#2563EB", "rgba(219,234,254,0.4)")}>{name}</span>,
    },
    {
      title: "Class Teacher",
      dataIndex: ["classTeacherId", "name"],
      render: (name) => name
        ? <span style={{ color: "var(--text-primary)" }}><UserOutlined style={{ color: "var(--text-muted)", marginRight: 6 }} />{name}</span>
        : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Not assigned</span>,
    },
    {
      title: "Enrollment",
      key: "enrollment",
      render: (_, sec) => {
        const enrolled = enrolledCount(sec);
        const capacity = sec.capacity || 0;
        const ratio = capacity ? enrolled / capacity : 0;
        const color = ratio >= 1 ? "#DC2626" : ratio >= 0.8 ? "#B45309" : "#15803D";
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
          ? <span style={pill("#15803D", "rgba(220,252,231,0.5)")}>Active</span>
          : <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>Inactive</span>;
      },
    },
  ];

  const tableData = filteredSections.map((sec) => ({ ...sec, key: sec._id }));

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Class & Section Explorer"
        subtitle="Select a school to explore its classes, sections, teachers and enrollment"
        icon={<ApartmentOutlined />}
      />

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={toolbarRow}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Select School</div>
            <Select
              placeholder="Choose School"
              loading={schoolLoading}
              style={{ width: "100%" }}
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
                style={{ width: "100%" }}
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
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search by class, section or teacher"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {selectedSchool && (
        <div style={{ ...statGrid(170), marginTop: 20 }}>
          <StatCard icon={<BookOutlined />} label="Classes" value={stats.totalClasses} color="#2563EB" />
          <StatCard icon={<ApartmentOutlined />} label="Sections" value={stats.totalSections} color="#7C3AED" />
          <StatCard icon={<TeamOutlined />} label="Total Capacity" value={stats.totalCapacity} color="#14B8A6" />
          <StatCard icon={<SolutionOutlined />} label="Enrolled Students" value={stats.totalEnrolled} color="#F59E0B" />
        </div>
      )}

      <style>{tableHeadCss("class-section-tbl")}</style>

      <div style={{ ...sectionPanel, marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Sections</span>
          {selectedSchool && (
            yearLoading ? (
              <Spin size="small" />
            ) : activeYearForSchool ? (
              <span style={pill("#2563EB", "rgba(219,234,254,0.4)")}>
                <CalendarOutlined /> Active Year: {activeYearForSchool.name || activeYearForSchool.code}
              </span>
            ) : (
              <span style={pill("#DC2626", "rgba(254,226,226,0.5)")}>No active academic year set for this school</span>
            )
          )}
        </div>
        {sectionLoading ? (
          <Spin />
        ) : (
          <div className="class-section-tbl" style={tableContainer}>
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
                        : selectedSchool && !activeYearForSchool
                        ? "This school has no active academic year — set one to view its sections"
                        : "No sections found"
                    }
                  />
                ),
              }}
            />
          </div>
        )}
>>>>>>> ecf8317b99aadd9e9c71cfaacb55ec35874e9a8d
      </div>
    </>
  );
};

export default SchoolClassSectionFilter;

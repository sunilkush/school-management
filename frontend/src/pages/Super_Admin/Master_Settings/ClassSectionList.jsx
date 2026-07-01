import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice";
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

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");

  // All sections for selected school+activeYear — stored locally so class filter doesn't wipe it
  const [allSchoolSections, setAllSchoolSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [yearLoading, setYearLoading] = useState(false);

  // 1. Mount
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchAllClasses());
  }, [dispatch]);

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
      </div>
    </>
  );
};

export default SchoolClassSectionFilter;

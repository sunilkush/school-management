import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchAllClasses } from "../../../features/classSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { Select, Table, Spin, Input } from "antd";
import { Layers, School2, BookOpen, LayoutList, Search, ChevronRight } from "lucide-react";
import {
  pageWrapper, sectionPanel, statGrid, statCard, statLabel, statValue,
  pill, tableHeadCss, emptyState, iconWell,
} from "../../../styles/pageStyles";

const ACCENT = "#6366F1";

const SchoolClassSectionFilter = () => {
  const dispatch = useDispatch();
  const { schools = [], loading: schoolLoading } = useSelector((s) => s.school);
  const { classList = [], loading: classLoading } = useSelector((s) => s.class || {});
  const { sections = [], loading: sectionLoading } = useSelector((s) => s.section);

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchSchools()); }, [dispatch]);

  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchAllClasses({ schoolId: selectedSchool }));
      dispatch(fetchSections({ schoolId: selectedSchool }));
      setSelectedClass(null);
    }
  }, [selectedSchool, dispatch]);

  const filteredSections = useMemo(() => {
    let data = selectedClass
      ? sections.filter((sec) => String(sec.schoolClassId?._id) === String(selectedClass))
      : sections;
    if (search) {
      data = data.filter((sec) =>
        sec.name?.toLowerCase().includes(search.toLowerCase()) ||
        sec.schoolClassId?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return data;
  }, [sections, selectedClass, search]);

  const selectedSchoolName = schools.find((s) => s._id === selectedSchool)?.name || "";
  const selectedClassName = classList.find((c) => c._id === selectedClass)?.name || "";

  const totalSections = sections.length;
  const totalClasses = classList.length;
  const uniqueClasses = new Set(sections.map((s) => s.schoolClassId?._id).filter(Boolean)).size;

  const columns = [
    {
      title: "#",
      key: "idx",
      width: 50,
      render: (_, __, i) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</span>,
    },
    {
      title: "Class",
      dataIndex: "className",
      render: (name) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={iconWell("#6366F1", 26)}><BookOpen size={12} /></div>
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
    {
      title: "School",
      dataIndex: "schoolName",
      render: (name) => name
        ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{name}</span>
        : <span style={{ color: "var(--text-muted)" }}>—</span>,
    },
  ];

  const tableData = filteredSections.map((sec) => ({
    key: sec._id,
    className: sec.schoolClassId?.name || "N/A",
    sectionName: sec.name,
    schoolName: selectedSchoolName,
  }));

  const isLoading = schoolLoading || classLoading || sectionLoading;

  return (
    <>
      <style>{tableHeadCss("classsection-tbl")}</style>
      <div style={pageWrapper}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={iconWell(ACCENT, 44)}><Layers size={22} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Classes & Sections</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Browse class-section mapping per school</div>
          </div>
        </div>

        {/* Breadcrumb trail */}
        {(selectedSchoolName || selectedClassName) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: "var(--text-muted)" }}>
            <School2 size={12} />
            <span style={{ color: selectedSchoolName ? "var(--text-primary)" : "var(--text-muted)", fontWeight: selectedSchoolName ? 600 : 400 }}>{selectedSchoolName || "All Schools"}</span>
            {selectedClassName && (
              <>
                <ChevronRight size={12} />
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{selectedClassName}</span>
              </>
            )}
          </div>
        )}

        {/* Stats — only show when school is selected */}
        {selectedSchool && (
          <div style={statGrid(160)}>
            {[
              { label: "Total Sections", value: totalSections, color: ACCENT, icon: <Layers size={18} /> },
              { label: "Total Classes", value: totalClasses, color: "#3B82F6", icon: <BookOpen size={18} /> },
              { label: "Classes with Sections", value: uniqueClasses, color: "#14B8A6", icon: <LayoutList size={18} /> },
              { label: "Showing", value: filteredSections.length, color: "#F59E0B", icon: <Search size={18} /> },
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

        {/* Filters Panel */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Filters</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {/* School */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>School</div>
              <Select
                placeholder="Choose School"
                loading={schoolLoading}
                style={{ width: "100%" }}
                onChange={(value) => setSelectedSchool(value)}
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
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Class</div>
              {classLoading
                ? <div style={{ paddingTop: 6 }}><Spin size="small" /></div>
                : (
                  <Select
                    placeholder={selectedSchool ? "Choose Class" : "Select school first"}
                    disabled={!selectedSchool}
                    style={{ width: "100%" }}
                    onChange={(value) => setSelectedClass(value)}
                    value={selectedClass}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {classList.map((c) => (
                      <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
                    ))}
                  </Select>
                )}
            </div>

            {/* Search */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Search</div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Sections {selectedSchool && <span style={pill(ACCENT, "rgba(99,102,241,0.1)")}>{filteredSections.length}</span>}
            </div>
            {!selectedSchool && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Select a school to view sections</span>
            )}
          </div>

          <Spin spinning={!!isLoading}>
            <div className="classsection-tbl">
              <Table
                columns={columns}
                dataSource={tableData}
                rowKey="key"
                pagination={tableData.length > 10 ? { pageSize: 15, size: "small", showSizeChanger: false } : false}
                locale={{
                  emptyText: (
                    <div style={emptyState}>
                      <Layers size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {!selectedSchool ? "Select a school to view classes and sections" : "No sections found"}
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

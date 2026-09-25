import { useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Col, Flex, Popconfirm, Row, Select, Space,
  Spin, Table, Typography, message,
} from "antd";
import {
  ArrowRightOutlined, CheckOutlined, ReloadOutlined,
  TeamOutlined, UserOutlined, UsergroupAddOutlined,
} from "@ant-design/icons";
import {
  clearPromotionCandidates,
  fetchPromotionAcademicYears,
  fetchPromotionCandidates,
  fetchPromotionClasses,
  fetchPromotionSections,
  promoteStudents,
} from "../../../features/studentPromotionSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { avatarStyle, iconWell } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const TBL = "promo-tbl";

/* ─── small label above a Select ───────────────────────────────── */
const FL = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
  }}>
    {children}
  </div>
);

/* ─── class / section pill ─────────────────────────────────────── */
const Pill = ({ children, color = "var(--primary)", bg = "var(--primary-light)", borderTint = "rgba(var(--primary-rgb), 0.15)" }) => (
  <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 99,
    fontSize: 12, fontWeight: 700,
    color, background: bg, border: `1px solid ${borderTint}`,
  }}>
    {children}
  </span>
);

/* Class names are strings like "CLASS 10", "Nursery", "UKG": plain alphabetical sorting puts
   CLASS 10 before CLASS 2. Pre-primary names get a fixed rank ahead of the numbered ones. */
const PRE_PRIMARY_RANK = { "pre-nursery": 0, playgroup: 1, nursery: 2, lkg: 3, kg: 3, ukg: 4 };
const classRank = (name) => {
  const n = (name || "").trim().toLowerCase();
  if (n in PRE_PRIMARY_RANK) return PRE_PRIMARY_RANK[n];
  const m = n.match(/(\d+)/);
  return m ? 100 + Number(m[1]) : 9999;
};
const byClassOrder = (a, b) => classRank(a.name) - classRank(b.name) || (a.name || "").localeCompare(b.name || "");

/* ─── Main ──────────────────────────────────────────────────────── */
export default function StudentPromotion() {
  const dispatch = useDispatch();

  const {
    academicYears, sourceClasses, targetClasses,
    sections, candidates, loading, promoting,
  } = useSelector((s) => s.studentPromotion);
  const { user } = useSelector((s) => s.auth);
  const schoolId = user?.school?._id;

  const [fromYearId,   setFromYearId]   = useState(null);
  const [toYearId,     setToYearId]     = useState(null);
  const [srcClassId,   setSrcClassId]   = useState(null);
  const [tgtClassId,   setTgtClassId]   = useState(null);
  const [tgtSectionId, setTgtSectionId] = useState(null);
  const [selected,     setSelected]     = useState([]);   // enrollmentIds

  /* ── load years on mount ── */
  useEffect(() => {
    dispatch(fetchPromotionAcademicYears())
      .unwrap()
      .then((years) => {
        const active = years.find((y) => y.isActive);
        if (active?._id) setFromYearId(active._id);
      })
      .catch((err) => message.error(err || "Failed to load academic years"));
  }, [dispatch]);

  /* ── source classes when from-year changes ── */
  useEffect(() => {
    if (!fromYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: fromYearId, mode: "source", schoolId }));
    setSrcClassId(null);
    setSelected([]);
    dispatch(clearPromotionCandidates());
  }, [fromYearId, schoolId, dispatch]);

  /* ── target classes when to-year changes ── */
  useEffect(() => {
    if (!toYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: toYearId, mode: "target", schoolId }));
    setTgtClassId(null);
    setTgtSectionId(null);
  }, [toYearId, schoolId, dispatch]);

  /* ── sections when target class changes ── */
  useEffect(() => {
    if (!tgtClassId) return;
    dispatch(fetchPromotionSections({ schoolClassId: tgtClassId }));
    setTgtSectionId(null);
  }, [tgtClassId, dispatch]);

  /* The year after the source one. A promotion almost always runs into the next year, and picking
     it by hand every time is four clicks nobody enjoys. */
  useEffect(() => {
    if (!fromYearId || toYearId) return;
    const from = academicYears.find((y) => y._id === fromYearId);
    if (!from) return;
    const later = academicYears
      .filter((y) => y._id !== fromYearId && new Date(y.startDate) > new Date(from.startDate))
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (later[0]) setToYearId(later[0]._id);
  }, [fromYearId, toYearId, academicYears]);

  /* …and the class above the source one: CLASS 9 → CLASS 10. */
  useEffect(() => {
    if (!srcClassId || tgtClassId || !targetClasses.length) return;
    const src = sourceClasses.find((c) => c._id === srcClassId);
    if (!src) return;
    const next = [...targetClasses].sort(byClassOrder).find((c) => classRank(c.name) > classRank(src.name));
    if (next) setTgtClassId(next._id);
  }, [srcClassId, tgtClassId, sourceClasses, targetClasses]);

  /* One section means there is nothing to choose. */
  useEffect(() => {
    if (tgtClassId && sections.length === 1 && !tgtSectionId) setTgtSectionId(sections[0]._id);
  }, [sections, tgtClassId, tgtSectionId]);

  /* The student list is the point of the page; it should not wait for a button. */
  useEffect(() => {
    if (!srcClassId || !fromYearId) return;
    dispatch(fetchPromotionCandidates({ schoolClassId: srcClassId, academicYearId: fromYearId }))
      .unwrap()
      .then(() => setSelected([]))
      .catch((err) => message.error(err || "Failed to load students"));
  }, [srcClassId, fromYearId, dispatch]);

  const nameOf       = (list, id) => list.find((x) => x._id === id)?.name || "";
  const srcClassName = nameOf(sourceClasses, srcClassId);
  const tgtClassName = nameOf(targetClasses, tgtClassId);
  const tgtSection   = nameOf(sections, tgtSectionId);
  const fromYearName = nameOf(academicYears, fromYearId);
  const toYearName   = nameOf(academicYears, toYearId);

  const canLoad    = !!srcClassId && !!fromYearId;
  const canPromote = selected.length > 0 && !!fromYearId && !!toYearId && !!tgtClassId && !!tgtSectionId;

  const handleLoad = () => {
    if (!canLoad) { message.warning("Select source year and class first"); return; }
    dispatch(fetchPromotionCandidates({ schoolClassId: srcClassId, academicYearId: fromYearId }))
      .unwrap()
      .then(() => setSelected([]))
      .catch((err) => message.error(err || "Failed to load students"));
  };

  const handlePromote = async () => {
    if (!canPromote) return;
    dispatch(promoteStudents({
      fromAcademicYearId: fromYearId,
      toAcademicYearId:   toYearId,
      toSchoolClassId:    tgtClassId,
      toSectionId:        tgtSectionId,
      enrollmentIds:      selected,
    }))
      .unwrap()
      .then((res) => {
        const n = res?.promotedCount || 0;
        message.success(`${n} student${n !== 1 ? "s" : ""} promoted successfully`);
        setSelected([]);
        handleLoad();
      })
      .catch((err) => message.error(err || "Promotion failed"));
  };

  /* ── table columns ── */
  const columns = useMemo(() => [
    {
      title: "Reg. No.",
      dataIndex: "registrationNumber",
      width: 140,
      render: (v) => (
        <Text code style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>{v || "—"}</Text>
      ),
    },
    {
      title: "Student",
      dataIndex: "name",
      render: (name) => (
        <Flex align="center" gap={10}>
          <div style={avatarStyle(name || "S", 34)}>
            {(name || "S")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.3 }}>
              {name || "—"}
            </div>
          </div>
        </Flex>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (v) => <Text className="u-meta">{v || "—"}</Text>,
    },
    {
      title: "Current Class",
      dataIndex: "currentClass",
      width: 120,
      render: (v) => <Pill color="var(--primary)" bg="var(--primary-light)" borderTint="rgba(var(--primary-rgb), 0.15)">{v || "—"}</Pill>,
    },
    {
      title: "Section",
      dataIndex: "currentSection",
      width: 100,
      render: (v) => <Pill color="var(--accent-hover)" bg="var(--accent-light)" borderTint="rgba(var(--accent-rgb), 0.15)">{v || "—"}</Pill>,
    },
  ], []);

  return (
    <>

      <PageHeader
        title="Student Promotion"
        subtitle="Promote students from one class and academic year to another"
        icon={<UsergroupAddOutlined />}
      />

      <div className="page-wrapper">

        {/* ── Config panel ──────────────────────────────── */}
        <div className="section-panel u-mb-4">

          {/* Panel label */}
          <Flex align="center" gap={10} className="u-mb-5">
            <div style={iconWell("var(--primary)", 38)}>
              <UsergroupAddOutlined style={{ fontSize: 17 }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                Promotion Configuration
              </Text>
              <Text className="u-meta">
                Set source and destination for the promotion
              </Text>
            </div>
          </Flex>

          {/* FROM / TO row */}
          <Row gutter={[0, 16]} align="middle">

            {/* FROM block */}
            <Col xs={24} md={10}>
              <div style={{
                background: "var(--surface-soft)",
                border: "1px solid var(--border-muted)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                  color: "var(--primary)", textTransform: "uppercase", marginBottom: 14,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }} />
                  FROM
                </div>
                <Space direction="vertical" className="u-full" size={12}>
                  <div>
                    <FL>Academic Year</FL>
                    <Select
                      className="promo-sel u-full"
                      placeholder="Select source year"
                      value={fromYearId}
                      options={academicYears.map((y) => ({ label: y.name, value: y._id }))}
                      onChange={setFromYearId}
                    />
                  </div>
                  <div>
                    <FL>Class</FL>
                    <Select
                      className="promo-sel u-full"
                      placeholder="Select source class"
                      value={srcClassId}
                      disabled={!fromYearId}
                      options={sourceClasses.map((c) => ({ label: c.name, value: c._id }))}
                      onChange={setSrcClassId}
                    />
                  </div>
                </Space>
              </div>
            </Col>

            {/* Arrow */}
            <Col xs={24} md={4}>
              <Flex justify="center" align="center" style={{ padding: "8px 0" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 18,
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                  transform: "rotate(0deg)",
                }}>
                  <ArrowRightOutlined />
                </div>
              </Flex>
            </Col>

            {/* TO block */}
            <Col xs={24} md={10}>
              <div style={{
                background: "var(--surface-soft)",
                border: "1px solid var(--border-muted)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                  color: "var(--accent-hover)", textTransform: "uppercase", marginBottom: 14,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-hover)" }} />
                  TO
                </div>
                <Space direction="vertical" className="u-full" size={12}>
                  <div>
                    <FL>Academic Year</FL>
                    <Select
                      className="promo-sel u-full"
                      placeholder="Select target year"
                      value={toYearId}
                      options={academicYears
                        .filter((y) => y._id !== fromYearId)
                        .map((y) => ({ label: y.name, value: y._id }))}
                      onChange={setToYearId}
                    />
                  </div>
                  <Row gutter={10}>
                    <Col span={12}>
                      <FL>Class</FL>
                      <Select
                        className="promo-sel u-full"
                        placeholder="Target class"
                        value={tgtClassId}
                        disabled={!toYearId}
                        options={targetClasses.map((c) => ({ label: c.name, value: c._id }))}
                        onChange={setTgtClassId}
                      />
                    </Col>
                    <Col span={12}>
                      <FL>Section</FL>
                      <Select
                        className="promo-sel u-full"
                        placeholder="Section"
                        value={tgtSectionId}
                        disabled={!tgtClassId || !sections.length}
                        options={sections.map((s) => ({ label: s.name, value: s._id }))}
                        onChange={setTgtSectionId}
                      />
                    </Col>
                  </Row>
                </Space>
              </div>
            </Col>
          </Row>

          {/* The list loads itself; this is here for when someone edits the class in another tab */}
          {canLoad && (
            <Flex justify="flex-end" className="u-mt-5">
              <Button
                icon={<ReloadOutlined />}
                type="text"
                onClick={handleLoad}
                loading={loading}
                className="u-meta"
              >
                Refresh list
              </Button>
            </Flex>
          )}
        </div>

        {/* ── Stat cards ────────────────────────────────── */}
        {candidates.length > 0 && (
          <Row gutter={[12, 12]} className="u-mb-4">
            {[
              {
                label: "Total Students",
                value: candidates.length,
                color: "var(--primary)",
                bg: "var(--primary-light)",
                borderTint: "rgba(var(--primary-rgb), 0.15)",
                icon: <TeamOutlined />,
              },
              {
                label: "Selected",
                value: selected.length,
                color: "var(--success-hover)",
                bg: "var(--success-light)",
                borderTint: "rgba(var(--success-rgb), 0.15)",
                icon: <CheckOutlined />,
              },
              {
                label: "Not Selected",
                value: candidates.length - selected.length,
                color: "var(--warning-hover)",
                bg: "var(--warning-light)",
                borderTint: "rgba(var(--warning-rgb), 0.15)",
                icon: <UserOutlined />,
              },
            ].map((s) => (
              <Col xs={8} key={s.label}>
                <div style={{
                  background: s.bg,
                  border: `1px solid ${s.borderTint}`,
                  borderTop: `4px solid ${s.color}`,
                  borderRadius: 14, padding: "14px 18px",
                }}>
                  <Flex align="center" gap={10}>
                    <div style={iconWell(s.color, 36)}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: s.color,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        opacity: 0.7, marginTop: 2,
                      }}>
                        {s.label}
                      </div>
                    </div>
                  </Flex>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* ── Empty state ────────────────────────────────── */}
        {!loading && candidates.length === 0 && (
          <div style={{
            textAlign: "center", padding: "56px 24px",
            background: "var(--surface-soft)",
            border: "1.5px dashed var(--border-muted)",
            borderRadius: 16, marginBottom: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
              background: "rgba(37,99,235,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, color: "var(--primary)",
            }}>
              🎓
            </div>
            <Text strong style={{ fontSize: 15, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>
              {srcClassId ? `No students in ${srcClassName || "this class"}` : "Pick a class to begin"}
            </Text>
            <Text className="u-meta-md">
              {srcClassId
                ? `${srcClassName || "This class"} has no active students in ${fromYearName || "this year"}. Try another class.`
                : "Choose the class these students are in today. The list loads by itself."}
            </Text>
          </div>
        )}

        {/* ── Table ─────────────────────────────────────── */}
        {candidates.length > 0 && (
          <div className="section-panel" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border-muted)" }}>
              <Flex align="center" justify="space-between">
                <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  Student List
                </Text>
                <Text className="u-meta">
                  {selected.length > 0
                    ? `${selected.length} of ${candidates.length} selected`
                    : `${candidates.length} student${candidates.length !== 1 ? "s" : ""}`}
                </Text>
              </Flex>
            </div>
            <Spin spinning={loading}>
              <Table
                className={`${TBL} data-table`}
                rowKey="enrollmentId"
                columns={columns}
                dataSource={candidates}
                pagination={{ pageSize: 20, size: "small", showTotal: (t) => `${t} students` }}
                rowSelection={{
                  selectedRowKeys: selected,
                  onChange: setSelected,
                  selections: [
                    Table.SELECTION_ALL,
                    Table.SELECTION_NONE,
                  ],
                }}
                scroll={{ x: 600 }}
              />
            </Spin>
          </div>
        )}

        {/* ── Action bar ────────────────────────────────── */}
        <div className="section-panel" style={{ marginBottom: 0, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {/* Left: selection count */}
          <Flex align="center" gap={14}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: selected.length > 0 ? "var(--primary)" : "var(--surface-soft)",
              border: `2px solid ${selected.length > 0 ? "var(--primary)" : "var(--border-muted)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800,
              color: selected.length > 0 ? "#fff" : "var(--text-muted)",
              transition: "all 0.2s",
              flexShrink: 0,
            }}>
              {selected.length}
            </div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                {selected.length === 0
                  ? "No students selected"
                  : `${selected.length} student${selected.length !== 1 ? "s" : ""} selected`}
              </Text>
              {selected.length > 0 && canPromote && (
                <Text className="u-meta">
                  {`${srcClassName} · ${fromYearName}`} <ArrowRightOutlined style={{ fontSize: 10 }} />{" "}
                  {`${tgtClassName}${tgtSection ? ` ${tgtSection}` : ""} · ${toYearName}`}
                </Text>
              )}
              {selected.length > 0 && !canPromote && (
                <Text style={{ fontSize: 12, color: "var(--warning-hover)" }}>
                  Fill target year, class and section to enable promotion
                </Text>
              )}
            </div>
          </Flex>

          {/* Right: actions */}
          <Space wrap>
            {selected.length > 0 && (
              <Button onClick={() => setSelected([])} style={{ borderRadius: 8 }}>
                Clear Selection
              </Button>
            )}
            <Popconfirm
              title="Promote Students"
              description={`Move ${selected.length} student${selected.length !== 1 ? "s" : ""} from ${srcClassName} (${fromYearName}) to ${tgtClassName}${tgtSection ? " " + tgtSection : ""} (${toYearName})?`}
              onConfirm={handlePromote}
              okText="Yes, Promote"
              cancelText="Cancel"
              disabled={!canPromote}
              okButtonProps={{ style: { background: "var(--success-hover)", borderColor: "var(--success-hover)" } }}
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={!canPromote}
                loading={promoting}
                style={{
                  borderRadius: 8, fontWeight: 700, height: 40,
                  background: canPromote ? "var(--success-hover)" : undefined,
                  borderColor: canPromote ? "var(--success-hover)" : undefined,
                }}
              >
                {promoting
                  ? "Promoting…"
                  : `Promote ${selected.length > 0 ? selected.length : ""} Student${selected.length !== 1 ? "s" : ""}`}
              </Button>
            </Popconfirm>
          </Space>
        </div>

      </div>
    </>
  );
}

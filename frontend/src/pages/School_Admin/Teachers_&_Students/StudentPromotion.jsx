import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Form, Select, Table, message } from "antd";
import {
  clearPromotionCandidates,
  fetchPromotionAcademicYears,
  fetchPromotionCandidates,
  fetchPromotionClasses,
  fetchPromotionSections,
  promoteStudents,
} from "../../../features/studentPromotionSlice";
import { GraduationCap } from "lucide-react";
const StudentPromotion = () => {
  const dispatch = useDispatch();
  const { academicYears, sourceClasses, targetClasses, sections, candidates, loading, promoting } = useSelector(
    (state) => state.studentPromotion
  );
  const { user } = useSelector((state) => state.auth);
  const schoolId = user.school?._id;

  const [fromAcademicYearId, setFromAcademicYearId] = useState(null);
  const [toAcademicYearId, setToAcademicYearId] = useState(null);
  const [sourceClassId, setSourceClassId] = useState(null);
  const [targetClassId, setTargetClassId] = useState(null);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    dispatch(fetchPromotionAcademicYears())
      .unwrap()
      .then((years) => {
        const active = years.find((y) => y.isActive);
        if (active?._id) setFromAcademicYearId(active._id);
      })
      .catch((err) => message.error(err || "Failed to load academic years"));
  }, [dispatch]);

  useEffect(() => {
    if (!fromAcademicYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: fromAcademicYearId, mode: "source", schoolId })).catch(() => {});
    setSourceClassId(null);
    setSelectedRowKeys([]);
    dispatch(clearPromotionCandidates());
  }, [dispatch, fromAcademicYearId, schoolId]);

  useEffect(() => {
    if (!toAcademicYearId) return;
    dispatch(fetchPromotionClasses({ academicYearId: toAcademicYearId, mode: "target", schoolId })).catch(() => {});
    setTargetClassId(null);
    setTargetSectionId(null);
  }, [dispatch, toAcademicYearId, schoolId]);

  useEffect(() => {
    if (!targetClassId) return;
    dispatch(fetchPromotionSections({ schoolClassId: targetClassId })).catch(() => {});
    setTargetSectionId(null);
  }, [dispatch, targetClassId]);

  const handleLoadStudents = () => {
    if (!sourceClassId || !fromAcademicYearId) {
      message.warning("Please select source academic year and class");
      return;
    }
    dispatch(fetchPromotionCandidates({ schoolClassId: sourceClassId, academicYearId: fromAcademicYearId }))
      .unwrap()
      .then(() => setSelectedRowKeys([]))
      .catch((err) => message.error(err || "Failed to load students"));
  };

  const handlePromoteStudents = () => {
    if (!selectedRowKeys.length) {
      message.warning("Please select at least one student");
      return;
    }
    if (!fromAcademicYearId || !toAcademicYearId || !targetClassId || !targetSectionId) {
      message.warning("Please fill all promotion details first");
      return;
    }
    dispatch(
      promoteStudents({
        fromAcademicYearId,
        toAcademicYearId,
        toSchoolClassId: targetClassId,
        toSectionId: targetSectionId,
        enrollmentIds: selectedRowKeys,
      })
    )
      .unwrap()
      .then((result) => {
        const promotedCount = result?.promotedCount || 0;
        message.success(`${promotedCount} students promoted successfully`);
        setSelectedRowKeys([]);
        handleLoadStudents();
      })
      .catch((err) => message.error(err || "Failed to promote students"));
  };

  const canLoad = !!sourceClassId && !!fromAcademicYearId;
  const canPromote =
    selectedRowKeys.length > 0 &&
    !!fromAcademicYearId &&
    !!toAcademicYearId &&
    !!targetClassId &&
    !!targetSectionId;

  const columns = useMemo(
    () => [
      {
        title: "Reg. No",
        dataIndex: "registrationNumber",
        key: "registrationNumber",
        render: (val) => (
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "#7c6ff7", fontWeight: 600 }}>{val}</span>
        ),
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (val) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "#7c6ff7", flexShrink: 0,
            }}>
              {val?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span style={{ fontWeight: 500, color: "#1a1a2e" }}>{val}</span>
          </div>
        ),
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (val) => <span style={{ color: "#888", fontSize: 13 }}>{val}</span>,
      },
      {
        title: "Current Class",
        dataIndex: "currentClass",
        key: "currentClass",
        render: (val) => (
          <span style={{
            display: "inline-block", padding: "2px 10px",
            background: "#f0eeff", color: "#7c6ff7",
            borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>{val}</span>
        ),
      },
      {
        title: "Section",
        dataIndex: "currentSection",
        key: "currentSection",
        render: (val) => (
          <span style={{
            display: "inline-block", padding: "2px 10px",
            background: "#f0fdf8", color: "#1d9e75",
            borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>{val}</span>
        ),
      },
    ],
    []
  );

  return (
    <div style={{
      minHeight: "100vh",
      //background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
      padding: "0px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .promo-select .ant-select-selector {
          border-radius: 10px !important;
          border: 1.5px solid #e8e4ff !important;
          font-size: 12px !important;
          height: 30px !important;
          background: #fdfcff !important;
          align-items: center !important;
        }
        .promo-select:hover .ant-select-selector,
        .promo-select.ant-select-focused .ant-select-selector {
          border-color: #7c6ff7 !important;
          box-shadow: 0 0 0 3px rgba(124, 111, 247, 0.1) !important;
        }
        .promo-select.ant-select-disabled .ant-select-selector {
          background: #f9f8ff !important;
          opacity: 0.6;
        }
        .promo-form .ant-form-item-label > label {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #aaa !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
        }
        .promo-table .ant-table {
          background: transparent !important;
        }
        .promo-table .ant-table-thead > tr > th {
          background: #f8f7ff !important;
          color: #aaa !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          border-bottom: 1px solid #ede9fe !important;
          padding: 12px 16px !important;
        }
        .promo-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f5f3ff !important;
          padding: 12px 16px !important;
        }
        .promo-table .ant-table-tbody > tr:hover > td {
          background: #faf8ff !important;
        }
        .promo-table .ant-table-tbody > tr.ant-table-row-selected > td {
          background: #f3f0ff !important;
        }
        .promo-table .ant-checkbox-checked .ant-checkbox-inner {
          background: #7c6ff7 !important;
          border-color: #7c6ff7 !important;
        }
        .promo-table .ant-checkbox:hover .ant-checkbox-inner {
          border-color: #7c6ff7 !important;
        }
        .promo-table .ant-pagination-item-active {
          border-color: #7c6ff7 !important;
        }
        .promo-table .ant-pagination-item-active a {
          color: #7c6ff7 !important;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 24px;
          height: 30px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .action-btn.ghost {
          background: #f0eeff;
          color: #7c6ff7;
          border: 1.5px solid #ddd8ff;
        }
        .action-btn.ghost:not(:disabled):hover {
          background: #e4dfff;
        }
        .action-btn.promote {
          background: linear-gradient(135deg, #1d9e75 0%, #0f6e56 100%);
          color: #fff;
          box-shadow: 0 4px 14px rgba(29, 158, 117, 0.3);
        }
        .action-btn.promote:not(:disabled):hover {
          box-shadow: 0 6px 20px rgba(29, 158, 117, 0.4);
          transform: translateY(-1px);
        }
        .divider-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #1677ff, #5a50c9);
          border-radius: 50%;
          color: #fff;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 26px;
          box-shadow: 0 3px 10px rgba(124, 111, 247, 0.35);
        }
      `}</style>

      <div style={{
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(124, 111, 247, 0.1), 0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden",
        Width: "100%",
        margin: "0 auto",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1677ff 0%, #5a50c9 100%)",
          padding: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: -50, right: 80, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative" }}>
           
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
              Student Promotion
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
              Select students, choose target class &amp; section, and promote to the next academic year.
            </p>
          </div>
        </div>

        <div style={{ padding: "20px" }}>

          {/* Filter Panel */}
          <div style={{
            background: "#faf9ff",
            border: "1px solid #ede9fe",
            borderRadius: 16,
            padding: "10px",
            marginBottom: 10,
          }}>

            {/* Section label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#b0a8f5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
              Promotion Configuration
            </div>

            <Form layout="vertical" className="promo-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto 1fr 1fr 1fr", gap: "0 16px", alignItems: "start" }}>

                {/* FROM side */}
                <Form.Item label="From Academic Year" style={{ marginBottom: 0 }}>
                  <Select
                    className="promo-select"
                    value={fromAcademicYearId}
                    placeholder="Source year"
                    options={academicYears.map((y) => ({ label: y.name, value: y._id }))}
                    onChange={setFromAcademicYearId}
                  />
                </Form.Item>

                <Form.Item label="Current Class" style={{ marginBottom: 0 }}>
                  <Select
                    className="promo-select"
                    value={sourceClassId}
                    placeholder="Source class"
                    options={sourceClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
                    onChange={setSourceClassId}
                  />
                </Form.Item>

                {/* Arrow divider */}
                <div className="divider-arrow">→</div>

                {/* TO side */}
                <Form.Item label="To Academic Year" style={{ marginBottom: 0 }}>
                  <Select
                    className="promo-select"
                    value={toAcademicYearId}
                    placeholder="Target year"
                    options={academicYears
                      .filter((y) => y._id !== fromAcademicYearId)
                      .map((y) => ({ label: y.name, value: y._id }))}
                    onChange={setToAcademicYearId}
                  />
                </Form.Item>

                <Form.Item label="Target Class" style={{ marginBottom: 0 }}>
                  <Select
                    className="promo-select"
                    value={targetClassId}
                    placeholder="Target class"
                    options={targetClasses.map((cls) => ({ label: cls.name, value: cls._id }))}
                    onChange={setTargetClassId}
                  />
                </Form.Item>

                <Form.Item label="Target Section" style={{ marginBottom: 0 }}>
                  <Select
                    className="promo-select"
                    value={targetSectionId}
                    placeholder="Target section"
                    disabled={!sections.length}
                    options={sections.map((sec) => ({ label: sec.name, value: sec._id }))}
                    onChange={setTargetSectionId}
                  />
                </Form.Item>
              </div>

              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="action-btn ghost"
                  disabled={!canLoad}
                  onClick={handleLoadStudents}
                >
                  {loading ? "Loading…" : "↓ Load Students"}
                </button>
              </div>
            </Form>
          </div>

          {/* Stats bar */}
          {candidates.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              {[
                { label: "Total Students", value: candidates.length, color: "#7c6ff7", bg: "#f0eeff" },
                { label: "Selected", value: selectedRowKeys.length, color: "#1d9e75", bg: "#f0fdf8" },
                { label: "Remaining", value: candidates.length - selectedRowKeys.length, color: "#e69020", bg: "#fef9ec" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  flex: 1, padding: "14px 20px",
                  background: stat.bg, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: stat.color, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && candidates.length === 0 && (
            <div style={{
              textAlign: "center", padding: "20px",
              border: "1.5px dashed #ddd8ff", borderRadius: 16,
              background: "#faf9ff", marginBottom: 10,
            }}>
              <div style={{  marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={60} /></div>
              <div style={{ fontWeight: 600, color: "#aaa", marginBottom: 4 }}>No students loaded</div>
              <div style={{ fontSize: 13, color: "#c5bef5" }}>Select a source year and class, then click "Load Students"</div>
            </div>
          )}

          {/* Table */}
          {candidates.length > 0 && (
            <div className="promo-table" style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid #ede9fe",
              marginBottom: 10,
            }}>
              <Table
                rowKey="enrollmentId"
                loading={loading}
                dataSource={candidates}
                columns={columns}
                pagination={{ pageSize: 20, size: "small" }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
                style={{ background: "#fff" }}
              />
            </div>
          )}

          {/* Bottom Action Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px",
            background: "#f8f7ff",
            borderRadius: 14,
            border: "1px solid #ede9fe",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: selectedRowKeys.length > 0 ? "linear-gradient(135deg, #7c6ff7, #5a50c9)" : "#e8e4ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700,
                color: selectedRowKeys.length > 0 ? "#fff" : "#c5bef5",
                transition: "all 0.2s",
              }}>
                {selectedRowKeys.length}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>
                  {selectedRowKeys.length === 0 ? "No students selected" : `${selectedRowKeys.length} student${selectedRowKeys.length > 1 ? "s" : ""} selected`}
                </div>
                {selectedRowKeys.length > 0 && (
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>
                    Ready to promote
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {selectedRowKeys.length > 0 && (
                <button
                  type="button"
                  className="action-btn ghost"
                  onClick={() => setSelectedRowKeys([])}
                >
                  Clear Selection
                </button>
              )}
              <button
                type="button"
                className="action-btn promote"
                disabled={!canPromote || promoting}
                onClick={handlePromoteStudents}
              >
                {promoting ? "Promoting…" : `✓ Promote ${selectedRowKeys.length > 0 ? selectedRowKeys.length : ""} Student${selectedRowKeys.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentPromotion;
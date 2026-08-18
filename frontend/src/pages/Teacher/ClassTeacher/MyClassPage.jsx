import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Spin, Tag } from "antd";
import {
  Users, ClipboardCheck, CalendarCheck, BookOpen, MapPinned,
} from "lucide-react";
import { fetchMyClassTeacherAssignment } from "../../../features/classTeacherSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper } from "../../../styles/pageStyles";

// RGB triples for the design tokens used on this page, keyed by var(--x) string — used
// to build alpha-tinted backgrounds/shadows from a CSS custom property (rgba() rather
// than the hex-alpha-suffix trick, which doesn't work once the base color is a var()).
const RGB = {
  "var(--purple)":  "var(--purple-rgb)",
  "var(--success)": "var(--success-rgb)",
  "var(--warning)": "var(--warning-rgb)",
  "var(--cyan)":    "6,182,212",
};
const tint = (colorVar, alpha) => `rgba(${RGB[colorVar] || "100,116,139"}, ${alpha})`;

const QuickCard = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border-muted)",
      borderRadius: 14,
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 10,
      cursor: "pointer",
      transition: "box-shadow 0.18s",
      textAlign: "left",
      width: "100%",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 18px ${tint(color, 0.19)}`)}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
  >
    <div style={{
      width: 42, height: 42, borderRadius: 12,
      background: tint(color, 0.09),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={20} color={color} strokeWidth={1.8} />
    </div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
  </button>
);

const MyClassPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { myAssignment, loading } = useSelector((s) => s.classTeacher);
  const { user }                  = useSelector((s) => s.auth);

  const rolePath = user?.role?.name?.toLowerCase() === "class teacher"
    ? "classteacher"
    : "teacher";

  useEffect(() => {
    dispatch(fetchMyClassTeacherAssignment());
  }, [dispatch]);

  if (loading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!myAssignment) {
    return (
      <div style={pageWrapper}>
        <PageHeader
          title="My Class"
          subtitle="Class teacher assignment"
          icon={<BookOpen size={20} />}
        />
        <div style={{
          marginTop: 32, textAlign: "center",
          background: "var(--surface)", border: "1px solid var(--border-muted)",
          borderRadius: 16, padding: "48px 32px",
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏫</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            No Class Assigned Yet
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            The school admin has not assigned you as a class teacher yet.
            Please contact your administrator.
          </div>
        </div>
      </div>
    );
  }

  const cls     = myAssignment.schoolClassId;
  const section = myAssignment.sectionId;
  const ay      = myAssignment.academicYearId;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Class"
        subtitle="You are the class in-charge for this class"
        icon={<BookOpen size={20} />}
      />

      {/* ── Class info card ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(var(--purple-rgb),0.09), rgba(6,182,212,0.09))",
        border: "1px solid var(--border-muted)",
        borderRadius: 16,
        padding: "24px 28px",
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(var(--purple-rgb),0.13)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30,
        }}>
          🏫
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            {cls?.name || cls?.grade || "—"}
            {section && (
              <Tag color="cyan" style={{ marginLeft: 10, fontSize: 14, fontWeight: 700 }}>
                {section.name}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Academic Year: {ay?.name || "—"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Class In-Charge: <strong style={{ color: "var(--text-primary)" }}>{user?.name}</strong>
          </div>
        </div>
      </div>

      {/* ── Quick action cards ── */}
      <div style={{ marginTop: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
        }}>
          Quick Actions
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: 12,
        }}>
          <QuickCard
            icon={ClipboardCheck}
            label="Mark Attendance"
            color="var(--success)"
            onClick={() => navigate(`/dashboard/${rolePath}/attendance/students`)}
          />
          <QuickCard
            icon={Users}
            label="My Students"
            color="var(--purple)"
            onClick={() => navigate(`/dashboard/${rolePath}/students`)}
          />
          <QuickCard
            icon={CalendarCheck}
            label="Timetable"
            color="var(--cyan)"
            onClick={() => navigate(`/dashboard/${rolePath}/timetable`)}
          />
          <QuickCard
            icon={MapPinned}
            label="GPS Check-In"
            color="var(--warning)"
            onClick={() => navigate(`/dashboard/${rolePath}/attendance/self`)}
          />
        </div>
      </div>
    </div>
  );
};

export default MyClassPage;

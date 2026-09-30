import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Spin, Tag } from "antd";
import {
  UserOutlined, BookOutlined, CalendarOutlined,
  FileTextOutlined, DashboardOutlined, ScheduleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { fetchAssignedClasses } from "../../../features/classSlice";
import { getExams } from "../../../features/examSlice";
import { fetchMyLeaveBalance } from "../../../features/leaveRequestSlice";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { getRoleName, getRolePath } from "../../../utils/roles";
import MyAttendanceSection from "../../../components/attendance/MyAttendanceSection";

// One small figure; clicking it goes where the figure comes from.
const Tile = ({ label, value, sub, icon, color, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: onClick ? "pointer" : "default",
      border: "1px solid var(--border-muted)", borderRadius: 12, padding: "10px 12px", background: "var(--surface)", minWidth: 0,
    }}
  >
    <span style={{
      width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      color, background: `color-mix(in srgb, ${color} 12%, transparent)`, fontSize: 16,
    }}>{icon}</span>
    <span style={{ minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ display: "block", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.15 }}>{value}</span>
      {sub ? <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span> : null}
    </span>
  </button>
);

const Panel = ({ title, extra, children }) => (
  <div className="section-panel" style={{ margin: 0, padding: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{title}</span>
      {extra}
    </div>
    {children}
  </div>
);

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth || {});
  const roleName = getRoleName(user);
  const rolePath = getRolePath(roleName);
  const go = (p) => navigate(`/dashboard/${rolePath}/${p}`);
  const isMedicalOfficer = roleName === "Medical Officer";
  const isLabTechnician = roleName === "Lab Technician";
  const isSportsTeacher = roleName === "Sports Teacher";
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const { classAssignTeacher = [], loading: classLoading } = useSelector((state) => state.class || {});
  const { exams = [], loading: examLoading } = useSelector((state) => state.exams || {});
  const { myBalance } = useSelector((state) => state.leaveRequests || {});
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    dispatch(fetchMyLeaveBalance());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    dispatch(fetchAssignedClasses({ academicYearId: selectedAcademicYear._id }));
    dispatch(getExams({ academicYearId: selectedAcademicYear._id }));
    apiClient.get("/student-portal/teacher/homework", { params: { academicYearId: selectedAcademicYear._id } })
      .then((res) => setAssignmentCount((res.data?.data || []).length))
      .catch(() => {});
  }, [dispatch, selectedAcademicYear?._id]);

  const data = useMemo(() => {
    const today = dayjs();
    const examDate = (e) => e?.date || e?.examDate || e?.startDate;
    const list = Array.isArray(exams) ? exams : [];
    const upcoming = list
      .filter((e) => examDate(e) && dayjs(examDate(e)).isValid() && !dayjs(examDate(e)).isBefore(today, "day"))
      .sort((a, b) => dayjs(examDate(a)).valueOf() - dayjs(examDate(b)).valueOf());
    const sections = classAssignTeacher.flatMap((cls) =>
      (cls?.sections || []).map((section) => ({
        className: cls?.name || "Class",
        sectionName: section?.sectionId?.name || "Section",
        isClassTeacher: Boolean(section?.isClassTeacher),
      }))
    );
    return {
      totalClasses: classAssignTeacher.length,
      totalStudents: classAssignTeacher.reduce((sum, cls) => sum + Number(cls?.studentCount || 0), 0),
      todayExams: upcoming.filter((e) => dayjs(examDate(e)).isSame(today, "day")).length,
      upcoming: upcoming.slice(0, 5).map((e) => ({
        name: e?.title || e?.name || "Untitled Exam",
        className: e?.classId?.name || e?.schoolClassId?.name || e?.className || "",
        date: examDate(e),
      })),
      sections,
    };
  }, [classAssignTeacher, exams]);

  const leaveLeft = myBalance?.isStaff
    ? (myBalance.CL?.available || 0) + (myBalance.EL?.available || 0) + (myBalance.CO?.available || 0)
    : null;

  const actions = isMedicalOfficer
    ? [["Health Records", "health-records"], ["Apply Leave", "leave"]]
    : isLabTechnician
      ? [["Lab Schedule", "timetable"], ["Apply Leave", "leave"]]
      : isSportsTeacher
        ? [["Mark Attendance", "attendance/students"], ["Sports", "sports"], ["My Classes", "classes"], ["Assignments", "assignments"], ["Apply Leave", "leave"]]
        : [["Mark Attendance", "attendance/students"], ["Assignments", "assignments"], ["Resources", "resources"], ["Lesson Plans", "lesson-plans"], ["Students", "students"], ["Class Reports", "reports"], ["Apply Leave", "leave"]];

  return (
    <>
      <PageHeader
        title={isMedicalOfficer ? "Medical Officer Dashboard" : isLabTechnician ? "Lab Technician Dashboard" : isSportsTeacher ? "Sports Teacher Dashboard" : "Teacher Dashboard"}
        subtitle={`Welcome back, ${user?.name || "Teacher"} · ${selectedAcademicYear?.name ?? ""}`}
        icon={<DashboardOutlined />}
      />
      <div className="page-wrapper">
        <MyAttendanceSection compact style={{ marginBottom: 12 }} />

        <Spin spinning={classLoading || examLoading}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            <Tile label="Classes" value={data.totalClasses} sub={`${data.sections.length} section(s)`} icon={<BookOutlined />} color="var(--primary)" onClick={() => go("classes")} />
            <Tile label="Students" value={data.totalStudents} icon={<UserOutlined />} color="var(--accent)" onClick={() => go("students")} />
            <Tile label="Assignments" value={assignmentCount} icon={<FileTextOutlined />} color="var(--success)" onClick={() => go("assignments")} />
            <Tile label="Exams today" value={data.todayExams} sub={`${data.upcoming.length} upcoming`} icon={<CalendarOutlined />} color="var(--warning)" />
            {leaveLeft != null && (
              <Tile
                label="Leave left" value={leaveLeft}
                sub={`CL ${myBalance.CL?.available || 0} · EL ${myBalance.EL?.available || 0}${myBalance.CO?.available ? ` · CO ${myBalance.CO.available}` : ""}`}
                icon={<ScheduleOutlined />} color="var(--purple)" onClick={() => go("leave")}
              />
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
            {actions.map(([label, path], i) => (
              <Button key={path} size="small" type={i === 0 ? "primary" : "default"} onClick={() => go(path)} style={{ borderRadius: 8 }}>
                {label}
              </Button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            <Panel title="Upcoming exams">
              {data.upcoming.length ? data.upcoming.map((e, i) => (
                <div key={`${e.name}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderTop: i ? "1px solid var(--border-muted)" : "none" }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="u-label">{e.name}</span>
                    {e.className ? <span className="u-muted" style={{ fontSize: 12 }}> · {e.className}</span> : null}
                  </span>
                  <span className="u-meta" style={{ whiteSpace: "nowrap" }}>{e.date ? dayjs(e.date).format("DD MMM") : "—"}</span>
                </div>
              )) : <Empty description="No upcoming exams" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: "8px 0" }} />}
            </Panel>

            <Panel title="My sections" extra={<Button type="link" size="small" style={{ padding: 0 }} onClick={() => go("reports")}>Class reports →</Button>}>
              {data.sections.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.sections.map((s, i) => (
                    <Tag key={`${s.className}-${s.sectionName}-${i}`} color={s.isClassTeacher ? "purple" : "blue"} style={{ margin: 0, padding: "2px 8px" }}>
                      {s.className}-{s.sectionName}{s.isClassTeacher ? " · Class teacher" : ""}
                    </Tag>
                  ))}
                </div>
              ) : <Empty description="No sections assigned yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: "8px 0" }} />}
            </Panel>
          </div>
        </Spin>
      </div>
    </>
  );
};

export default TeacherDashboard;

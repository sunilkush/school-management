import React, { useEffect, useState } from "react";
import {
  DatePicker,
  Input,
  Button,
  Switch,
  message,
  Typography,
  Tag,
  Skeleton,
} from "antd";
import {
  CalendarOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import {
  createAcademicYear,
  fetchAllAcademicYears,
  setActiveAcademicYear,
  clearAcademicYearMessages,
} from "../../../features/academicYearSlice";
import { useTheme } from "../../../context/ThemeContext";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const tokens = (isDark) => ({
  cardBg:    isDark ? "#141414" : "#ffffff",
  innerBg:   isDark ? "#0f0f0f" : "#f8faff",
  border:    isDark ? "#1f1f1f" : "#f0f0f0",
  rowHover:  isDark ? "#1a1a1a" : "#f8faff",
  textPri:   isDark ? "#e8e8e8" : "#111827",
  textSec:   isDark ? "#6b7280" : "#9ca3af",
  accent:    "#1677ff",
  accentBg:  isDark ? "rgba(22,119,255,0.08)" : "rgba(22,119,255,0.06)",
  success:   "#0ea472",
  successBg: isDark ? "rgba(14,164,114,0.08)" : "rgba(14,164,114,0.06)",
  inputBg:   isDark ? "#1a1a1a" : "#ffffff",
  shadow:    isDark ? "0 2px 12px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.06)",
  thBg:      isDark ? "#0f0f0f" : "#f9fafb",
  thBorder:  isDark ? "#1f1f1f" : "#f0f0f0",
});

const SchoolAcademicYear = ({ next }) => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const t = tokens(isDark);

  const { academicYears = [], loading, error, message: successMessage } =
    useSelector((state) => state.academicYear);
  const user    = useSelector((state) => state.auth.user);
  const schoolId = user?.school?._id;

  const [name, setName]   = useState("");
  const [dates, setDates] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (schoolId) dispatch(fetchAllAcademicYears(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (error)          { message.error(error);          dispatch(clearAcademicYearMessages()); }
    if (successMessage) { message.success(successMessage); dispatch(clearAcademicYearMessages()); }
  }, [error, successMessage, dispatch]);

  const handleCreate = async () => {
    if (!name || dates.length !== 2) return message.warning("Fill all fields");
    try {
      await dispatch(createAcademicYear({
        schoolId, name,
        startDate: dates[0].toISOString(),
        endDate:   dates[1].toISOString(),
      })).unwrap();
      setName(""); setDates([]);
    } catch (err) { console.log(err); }
  };

  const handleActiveChange = async (id) => {
    try { await dispatch(setActiveAcademicYear(id)).unwrap(); }
    catch (err) { console.log(err); }
  };

  const sorted = [...academicYears].reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Create form ── */}
      <div style={{
        background: t.innerBg,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: t.accentBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlusOutlined style={{ fontSize: 12, color: t.accent }} />
          </div>
          <Text style={{ fontSize: 13, fontWeight: 700, color: t.textPri }}>
            Create Academic Year
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input
            placeholder="e.g. 2024-2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            prefix={<CalendarOutlined style={{ color: t.textSec, fontSize: 13 }} />}
            style={{ borderRadius: 8, background: t.inputBg, height: 38 }}
          />
          <RangePicker
            style={{ width: "100%", borderRadius: 8, height: 38 }}
            value={dates}
            onChange={(val) => setDates(val || [])}
            format="DD MMM YYYY"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            loading={loading}
            disabled={!name || dates.length !== 2}
            style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
          >
            Create Academic Year
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
  background: t.cardBg,
  border: `1px solid ${t.border}`,
  borderRadius: 12,
  overflow: "hidden",
}}>

  {/* Desktop Table */}
  <div className="table-desktop">
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead>
          <tr style={{ background: t.thBg, borderBottom: `1px solid ${t.thBorder}` }}>
            {["Year", "Duration", "Dates", "Status", "Active"].map((h) => (
              <th key={h} style={{
                padding: "10px 16px",
                textAlign: "left",
                fontSize: 11,
                fontWeight: 600,
                color: t.textSec,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && !sorted.length ? (
            [1, 2, 3].map((i) => (
              <tr key={i}>
                <td colSpan={5} style={{ padding: "12px 16px" }}>
                  <Skeleton active title={false} paragraph={{ rows: 1 }} />
                </td>
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 40, textAlign: "center" }}>
                <Text style={{ color: t.textSec, fontSize: 13 }}>
                  No academic years yet — create one above.
                </Text>
              </td>
            </tr>
          ) : (
            sorted.map((yr, i) => {
              const start = dayjs(yr.startDate);
              const end = dayjs(yr.endDate);
              const months = end.diff(start, "month");
              const isHov = hovered === i;

              return (
                <tr
                  key={yr._id}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: isHov ? t.rowHover : "transparent",
                    borderBottom: `1px solid ${t.thBorder}`,
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <Text style={{ fontWeight: 600 }}>{yr.name}</Text>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: t.accent,
                      background: t.accentBg,
                      padding: "2px 8px",
                      borderRadius: 99,
                    }}>
                      {months} months
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <Text style={{ fontSize: 12, color: t.textSec }}>
                      {start.format("DD MMM YYYY")} → {end.format("DD MMM YYYY")}
                    </Text>
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    {yr.isActive ? (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.success,
                        background: t.successBg,
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}>
                        <CheckCircleFilled style={{ fontSize: 10 }} /> Active
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11,
                        color: t.textSec,
                        background: "#f3f4f6",
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}>
                        Inactive
                      </span>
                    )}
                  </td>

                  <td style={{ padding: "12px 16px" }}>
                    <Switch
                      checked={yr.isActive}
                      disabled={yr.isActive}
                      size="small"
                      onChange={() => handleActiveChange(yr._id)}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>

  {/* Mobile Card View */}
  <div className="table-mobile">
    {loading && !sorted.length ? (
      [1, 2, 3].map((i) => (
        <div key={i} style={{ padding: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ))
    ) : sorted.length === 0 ? (
      <div style={{ padding: 30, textAlign: "center" }}>
        <Text>No academic years yet</Text>
      </div>
    ) : (
      sorted.map((yr) => {
        const start = dayjs(yr.startDate);
        const end = dayjs(yr.endDate);
        const months = end.diff(start, "month");

        return (
          <div key={yr._id} style={{
            padding: 14,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}>
            <Text style={{ fontWeight: 600 }}>{yr.name}</Text>

            <Text style={{ fontSize: 12, color: t.textSec }}>
              {start.format("DD MMM")} → {end.format("DD MMM YYYY")}
            </Text>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize: 11,
                background: t.accentBg,
                color: t.accent,
                padding: "2px 8px",
                borderRadius: 99,
              }}>
                {months} months
              </span>

              <Switch
                checked={yr.isActive}
                size="small"
                onChange={() => handleActiveChange(yr._id)}
              />
            </div>

            <div>
              {yr.isActive ? (
                <span style={{ fontSize: 11, color: t.success }}>Active</span>
              ) : (
                <span style={{ fontSize: 11, color: t.textSec }}>Inactive</span>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

{/* Responsive CSS */}
<style>{`
  .table-mobile { display: none; }

  @media (max-width: 768px) {
    .table-desktop { display: none; }
    .table-mobile { display: block; }
  }

  @media (min-width: 769px) {
    .table-desktop { display: block; }
    .table-mobile { display: none; }
  }
`}</style>

      {/* Next step */}
      {next && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            onClick={next}
            disabled={!academicYears.length}
            style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
          >
            Next: Boards →
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchoolAcademicYear;
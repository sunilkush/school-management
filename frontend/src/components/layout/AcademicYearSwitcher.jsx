import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Spin, Typography } from "antd";

// import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;
const { Text } = Typography;

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();
  const hasSentRef = useRef(false); // 🔥 prevent multiple calls

  const { user } = useSelector((state) => state.auth);
  const { activeYear, loading, error } = useSelector(
    (state) => state.academicYear
  );

  const schoolId = user?.school?._id;

  /* ================= FETCH ACTIVE YEAR ================= */

  useEffect(() => {
    if (schoolId && !activeYear) {
      // 🔥 enable this if not already loaded globally
      // dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId, activeYear]);

  /* ================= SEND TO PARENT ================= */

  useEffect(() => {
    if (activeYear && !hasSentRef.current) {
      hasSentRef.current = true;
      onChange?.(activeYear);
    }
  }, [activeYear, onChange]);

  /* ================= DATE FORMAT ================= */

  const formatDate = (dateStr) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    if (isNaN(date)) return "";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ================= LOADING ================= */

  if (loading) {
    return <Spin size="small" />;
  }

  /* ================= ERROR ================= */

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  /* ================= UI ================= */

  return (
    <Select
      style={{ width: 240 }}
      value={activeYear?._id || undefined}
      placeholder="No Active Year"
      disabled
    >
      {activeYear ? (
        <Option value={activeYear._id}>
          {formatDate(activeYear.startDate)} -{" "}
          {formatDate(activeYear.endDate)}
        </Option>
      ) : (
        <Option value="no-year" disabled>
          No Active Academic Year
        </Option>
      )}
    </Select>
  );
};

export default AcademicYearSwitcher;
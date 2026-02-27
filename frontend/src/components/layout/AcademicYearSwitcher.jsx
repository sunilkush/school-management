import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Spin, Typography } from "antd";
import {
  fetchActiveAcademicYear,
  fetchAllAcademicYears,
} from "../../features/academicYearSlice";

const { Option } = Select;
const { Text } = Typography;

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { academicYears, activeYear, loading, error } = useSelector(
    (state) => state.academicYear
  );

  const schoolId = user?.school?._id;

  // 🔹 Derived flags (avoid repeated logic)
  const hasAcademicYears = academicYears?.length > 0;
  const hasActiveYear = Boolean(activeYear);

  useEffect(() => {
    if (!schoolId) return;

    if (!hasAcademicYears) {
      dispatch(fetchAllAcademicYears(schoolId));
    }

    if (!hasActiveYear) {
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId, hasAcademicYears, hasActiveYear]);

  const handleChange = (value) => {
    const selectedYear = academicYears?.find((y) => y._id === value);
    onChange?.(selectedYear);
  };

  // 🔹 Memoized date formatter (optional optimization)
  const formatDate = useMemo(
    () => (dateStr) =>
      dateStr
        ? new Date(dateStr).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
    []
  );

  if (loading && !hasAcademicYears && !hasActiveYear) {
    return <Spin size="small" tip="Loading academic years..." />;
  }

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <Select
  style={{ width: 220 }}
  placeholder="Select Academic Year"
  value={activeYear?._id}
  onChange={handleChange}
  allowClear={false}
  loading={loading}
  
>
  {Array.isArray(academicYears) &&
    academicYears.map((year) => (
      <Option key={year._id} value={year._id}>
        {formatDate(year.startDate)} - {formatDate(year.endDate)}
      </Option>
    ))}
</Select>
  );
};

export default AcademicYearSwitcher;

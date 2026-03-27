import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Spin, Typography } from "antd";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;
const { Text } = Typography;

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { activeYear, loading, error } = useSelector(
    (state) => state.academicYear
  );

  const schoolId = user?.school?._id;

  const hasActiveYear = Boolean(activeYear);

  // 🔥 Fetch only active year
  useEffect(() => {
    if (!schoolId) return;

    if (!hasActiveYear) {
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId, hasActiveYear]);

  // 🔥 Format date
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

  // 🔥 Handle change (only one active year)
  const handleChange = () => {
    if (activeYear) {
      onChange?.(activeYear);
    }
  };

  // 🔥 Loading state
  if (loading && !hasActiveYear) {
    return <Spin size="small" />;
  }

  // 🔥 Error state
  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <Select
      style={{ width: 220 }}
      placeholder="Academic Year"
      value={activeYear?._id}
      onChange={handleChange}
      loading={loading}
      disabled={true}

    >
      {activeYear && (
        <Option value={activeYear._id}>
          {formatDate(activeYear.startDate)} -{" "}
          {formatDate(activeYear.endDate)}
        </Option>
      )}
    </Select>
  );
};

export default AcademicYearSwitcher;
import React, { useEffect } from "react";
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

  useEffect(() => {
    if (!schoolId) return;

    // Only fetch when Redux has no data
    if (academicYears.length === 0) {
      dispatch(fetchAllAcademicYears(schoolId));
    }
    if (!activeYear) {
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId, academicYears, activeYear]);

  const handleChange = (value) => {
    const selectedYear = academicYears.find((y) => y._id === value);
    if (onChange) onChange(selectedYear);
  };

  // Date format helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && academicYears.length === 0 && !activeYear) {
    return <Spin size="small" tip="Loading academic years..." />;
  }

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <Select
      style={{ width: 220 }}
      placeholder="Select Academic Year"
      value={activeYear?._id || undefined}
      onChange={handleChange}
      size="middle"
    >
      {academicYears.map((year) => (
        <Option key={year._id} value={year._id}>
          {formatDate(year.startDate)} - {formatDate(year.endDate)}
        </Option>
      ))}
    </Select>
  );
};

export default AcademicYearSwitcher;

import React, { useEffect } from "react";
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

  // 🔹 Sirf active year fetch karo
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId]);

  // 🔹 Auto send to parent
  useEffect(() => {
    if (activeYear) {
      onChange?.(activeYear);
    }
  }, [activeYear, onChange]);

  // 🔹 Date formatter
  const formatDate = (dateStr) => {
    return dateStr
      ? new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
  };

  // 🔹 Loading
  if (loading && !activeYear) {
    return <Spin size="small" tip="Loading active year..." />;
  }

  // 🔹 Error
  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <Select
      style={{ width: 220 }}
      value={activeYear?._id}
      disabled // 🔥 user change nahi karega
    >
      {activeYear ? (
        <Option value={activeYear._id}>
          {formatDate(activeYear.startDate)} -{" "}
          {formatDate(activeYear.endDate)}
        </Option>
      ) : (
        <Option disabled>No Active Year</Option>
      )}
    </Select>
  );
};

export default AcademicYearSwitcher;
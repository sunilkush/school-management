import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Spin, Typography } from "antd";
import {
  fetchActiveAcademicYear,
  setSelectedAcademicYear,
} from "../../features/academicYearSlice";

const { Option } = Select;
const { Text } = Typography;

const AcademicYearSwitcher = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const {
    activeYear,
    selectedAcademicYear,
    loading,
    error,
    isFetched 
  } = useSelector((state) => state.academicYear);

  const schoolId = user?.school?._id;

  /* ===========================
     📡 FETCH ACTIVE YEAR
  ============================ */
useEffect(() => {
  if (!schoolId || isFetched) return; // ✅ BEST FIX

  dispatch(fetchActiveAcademicYear(schoolId));
}, [dispatch, schoolId, isFetched]);

  /* ===========================
     🧠 AUTO SET SELECTED
  ============================ */
  useEffect(() => {
    if (activeYear && !selectedAcademicYear) {
      dispatch(setSelectedAcademicYear(activeYear));
    }
  }, [activeYear, selectedAcademicYear, dispatch]);

  /* ===========================
     📅 FORMAT DATE
  ============================ */
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

  /* ===========================
     🔄 HANDLE CHANGE
  ============================ */
  const handleChange = (value) => {
    if (!value) return;

    // since only active year, just set it
    dispatch(setSelectedAcademicYear(activeYear));
  };

  /* ===========================
     ⏳ LOADING
  ============================ */
  if (loading && !activeYear) {
    return <Spin size="small" />;
  }

  /* ===========================
     ❌ ERROR
  ============================ */
  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <Select
      style={{ width: 220,color:"var(--text-primary)" }}
      placeholder="Academic Year"
      value={selectedAcademicYear?._id}
      onChange={handleChange}
      loading={loading}
      disabled // Disable if no active year
      
     // 🔥 because only one active year
      
    >
      {activeYear && (
        <Option value={activeYear._id} >
          {formatDate(activeYear.startDate)} -{" "}
          {formatDate(activeYear.endDate)}
        </Option>
      )}
    </Select>
  );
};

export default AcademicYearSwitcher;
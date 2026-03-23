import React, { useEffect } from "react";
import { Layout, Row, Col, Card, Spin, Empty, Alert } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";

const { Content } = Layout;

const SchoolAdminReport = () => {
  const dispatch = useDispatch();

  // ✅ error bhi le lo
  const { summary, loading, error } = useSelector(
    (state) => state.dashboard || {}
  );

  const storedUser = localStorage.getItem("user");

  let parsedRole = "";
  let parsedSchoolId = "";

  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      parsedRole = userObj?.role?.name || "";
      parsedSchoolId = userObj?.school?._id || "";
    } catch (err) {
      console.error("Invalid user object", err);
    }
  }

  useEffect(() => {
    if (parsedRole && parsedSchoolId) {
      dispatch(
        fetchDashboardSummary({
          role: parsedRole,
          schoolId: parsedSchoolId,
        })
      );
    }
  }, [dispatch, parsedRole, parsedSchoolId]);

  // ✅ Format value safely
  const formatValue = (item) => {
    if (item.format === "currency") {
      return `₹${Number(item.value || 0).toLocaleString()}`;
    }
    if (item.format === "percent") {
      return `${item.value || 0}%`;
    }
    return item.value ?? 0;
  };

  // ✅ Render cards safely
  const renderSummaryCards = () => {
    if (!Array.isArray(summary) || summary.length === 0) {
      return <Empty description="No data available" />;
    }

    return summary.map((item, index) => (
      <Col xs={24} sm={12} md={8} lg={6} key={index}>
        <Card
          bordered={false}
          hoverable
          style={{
            textAlign: "center",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h4 style={{ color: "#888" }}>{item.title}</h4>
          <h2 style={{ margin: 0 }}>{formatValue(item)}</h2>
        </Card>
      </Col>
    ));
  };

  return (
    <Layout style={{ background: "#f0f2f5", minHeight: "100vh", padding: 16 }}>
      <Content>
        <h2 style={{ marginBottom: 20 }}>{parsedRole} Dashboard</h2>

        {/* 🔄 Loading */}
        {loading && (
          <div style={{ textAlign: "center", marginTop: 100 }}>
            <Spin size="large" />
          </div>
        )}

        {/* ❌ Error Message */}
        {!loading && error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        {/* ✅ Data */}
        {!loading && !error && (
          <Row gutter={[16, 16]}>{renderSummaryCards()}</Row>
        )}
      </Content>
    </Layout>
  );
};

export default SchoolAdminReport;
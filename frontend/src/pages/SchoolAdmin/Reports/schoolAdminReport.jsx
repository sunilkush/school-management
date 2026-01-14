import React, { useEffect, useState } from "react";
import {
  Layout,
  Breadcrumb,
  Row,
  Col,
  Card,
  Table,
  Tag,
  Spin,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardSummary } from "../../../features/dashboardSlice";

const { Content } = Layout;

const SchoolAdminReport = () => {
  const dispatch = useDispatch();
  const { summary, loading } = useSelector((state) => state.dashboard);

  const storedUser = localStorage.getItem("user");
  let parsedRole = "";
  let parsedSchoolId = "";

  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      parsedRole = userObj?.role?.name || "";
      parsedSchoolId = userObj?.school?._id || "";
    } catch (e) {
      console.error("Invalid user object in localStorage", e);
    }
  }

  useEffect(() => {
    if (parsedRole && parsedSchoolId) {
      dispatch(fetchDashboardSummary({ role: parsedRole, schoolId: parsedSchoolId }));
    }
  }, [dispatch, parsedRole, parsedSchoolId]);

  // Mock detailed data for tables
  const [attendanceData, setAttendanceData] = useState([
    { key: 1, class: "1st Grade", total: 50, present: 48, absent: 2 },
    { key: 2, class: "2nd Grade", total: 45, present: 43, absent: 2 },
    { key: 3, class: "3rd Grade", total: 40, present: 38, absent: 2 },
  ]);

  const [feeData, setFeeData] = useState([
    { key: 1, student: "John Doe", totalFee: 5000, paid: 5000, pending: 0 },
    { key: 2, student: "Jane Smith", totalFee: 5000, paid: 3000, pending: 2000 },
  ]);

  const [hostelData, setHostelData] = useState([
    { key: 1, roomNumber: "101", capacity: 2, occupied: 2 },
    { key: 2, roomNumber: "102", capacity: 3, occupied: 1 },
  ]);

  const [transportData, setTransportData] = useState([
    { key: 1, vehicle: "Bus 1", route: "Route A", students: 20 },
    { key: 2, vehicle: "Bus 2", route: "Route B", students: 15 },
  ]);

  const [libraryData, setLibraryData] = useState([
    { key: 1, book: "Mathematics", issued: 5, overdue: 1 },
    { key: 2, book: "Science", issued: 3, overdue: 0 },
  ]);

  const [employeeSalaries, setEmployeeSalaries] = useState([
    { key: 1, name: "John Doe", salary: 30000, paid: 30000, pending: 0 },
    { key: 2, name: "Jane Smith", salary: 25000, paid: 20000, pending: 5000 },
  ]);

  const [inventoryData, setInventoryData] = useState([
    { key: 1, item: "Projector", quantity: 5, lowStock: false },
    { key: 2, item: "Markers", quantity: 2, lowStock: true },
  ]);

  // Render summary cards
  const renderSummaryCards = () => {
    if (!summary) return null;
    return Object.keys(summary).map((key) => {
      const item = summary[key]; // {title, value}
      if (!item || typeof item.value === "undefined") return null;
      return (
        <Col xs={24} sm={12} md={8} lg={6} key={key} style={{ marginBottom: 16 }}>
          <Card
            title={item.title}
            bordered={false}
            hoverable
            style={{ textAlign: "center" }}
          >
            <span style={{ fontSize: 24, fontWeight: "bold" }}>{item.value}</span>
          </Card>
        </Col>
      );
    });
  };

  return (
    <Layout style={{ padding: "0px", background: "#f0f2f5", minHeight: "100vh" }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Reports</Breadcrumb.Item>
        <Breadcrumb.Item>{parsedRole} Report</Breadcrumb.Item>
      </Breadcrumb>

      <Content>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: 8 }}>
          {parsedRole} Dashboard
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          Overview of all school reports and key metrics.
        </p>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: 100 }}>
            <Spin size="large" tip="Loading summary..." />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <Row gutter={16}>{renderSummaryCards()}</Row>

            {/* Attendance */}
            <Card title="Attendance Report" style={{ marginTop: 24 }}>
              <Table
                columns={[
                  { title: "Class", dataIndex: "class", key: "class" },
                  { title: "Total", dataIndex: "total", key: "total" },
                  { title: "Present", dataIndex: "present", key: "present" },
                  {
                    title: "Absent",
                    dataIndex: "absent",
                    key: "absent",
                    render: (absent) => <Tag color="red">{absent}</Tag>,
                  },
                ]}
                dataSource={attendanceData}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Fee Report */}
            <Card title="Fee Collection Report" style={{ marginTop: 24 }}>
              <Table
                columns={[
                  { title: "Student", dataIndex: "student", key: "student" },
                  { title: "Total Fee", dataIndex: "totalFee", key: "totalFee" },
                  { title: "Paid", dataIndex: "paid", key: "paid" },
                  {
                    title: "Pending",
                    dataIndex: "pending",
                    key: "pending",
                    render: (pending) => (
                      <Tag color={pending > 0 ? "red" : "green"}>{pending}</Tag>
                    ),
                  },
                ]}
                dataSource={feeData}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Hostel Report */}
            <Card title="Hostel Report" style={{ marginTop: 24 }} >
              <Table
                columns={[
                  { title: "Room", dataIndex: "roomNumber", key: "roomNumber" },
                  { title: "Capacity", dataIndex: "capacity", key: "capacity" },
                  {
                    title: "Occupied",
                    dataIndex: "occupied",
                    key: "occupied",
                    render: (occupied, record) => (
                      <Tag color={occupied === record.capacity ? "red" : "green"}>
                        {occupied}/{record.capacity}
                      </Tag>
                    ),
                  },
                ]}
                dataSource={hostelData}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Transport Report */}
            <Card title="Transport Report" style={{ marginTop: 24 }}>
              <Table
                columns={[
                  { title: "Vehicle", dataIndex: "vehicle", key: "vehicle" },
                  { title: "Route", dataIndex: "route", key: "route" },
                  { title: "Assigned Students", dataIndex: "students", key: "students" },
                ]}
                dataSource={transportData}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Library Report */}
            <Card title="Library Report" style={{ marginTop: 24 }}>
              <Table
                columns={[
                  { title: "Book", dataIndex: "book", key: "book" },
                  { title: "Issued", dataIndex: "issued", key: "issued" },
                  {
                    title: "Overdue",
                    dataIndex: "overdue",
                    key: "overdue",
                    render: (overdue) => <Tag color={overdue > 0 ? "red" : "green"}>{overdue}</Tag>,
                  },
                ]}
                dataSource={libraryData}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Employee Salaries */}
            <Card title="Employee Salaries" style={{ marginTop: 24 }}>
              <Table
                columns={[
                  { title: "Name", dataIndex: "name", key: "name" },
                  { title: "Salary", dataIndex: "salary", key: "salary" },
                  { title: "Paid", dataIndex: "paid", key: "paid" },
                  {
                    title: "Pending",
                    dataIndex: "pending",
                    key: "pending",
                    render: (pending) => <Tag color={pending > 0 ? "red" : "green"}>{pending}</Tag>,
                  },
                ]}
                dataSource={employeeSalaries}
                rowKey="key"
                pagination={false}
              />
            </Card>

            {/* Inventory & Supplies */}
            <Card title="Inventory & Supplies" style={{ marginTop: 24, marginBottom: 24 }}>
              <Table
                columns={[
                  { title: "Item", dataIndex: "item", key: "item" },
                  { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                  {
                    title: "Low Stock",
                    dataIndex: "lowStock",
                    key: "lowStock",
                    render: (lowStock) => <Tag color={lowStock ? "red" : "green"}>{lowStock ? "Yes" : "No"}</Tag>,
                  },
                ]}
                dataSource={inventoryData}
                rowKey="key"
                pagination={false}
              />
            </Card>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default SchoolAdminReport;

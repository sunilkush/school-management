import React, { useEffect, useMemo, useState } from "react";
import { Alert, Breadcrumb, Col, Form, Input, Layout, Row, message } from "antd";
import dayjs from "dayjs";
import httpClient from "../../../api/httpClient";
import SalaryStructureForm from "../../../components/payroll/SalaryStructureForm";
import SalaryStructureTable from "../../../components/payroll/SalaryStructureTable";
import { usePayrollStructures } from "../../../hooks/payrollHooks";

const { Content } = Layout;

const SalaryStructures = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const { loading, structures, refreshStructures } = usePayrollStructures();

  useEffect(() => {
    httpClient
      .get("/employee")
      .then((res) => setEmployees(res?.data?.data || []))
      .catch(() => message.error("Employee list load failed"));
  }, []);

  const validateOverlap = (values) => {
    const targetEmployee = values.employeeId;
    const from = dayjs(values.effectiveFrom);
    const to = values.effectiveTo ? dayjs(values.effectiveTo) : null;

    return !structures.some((s) => {
      if (editingId && s._id === editingId) return false;
      const empId = s.employeeId?._id || s.employeeId;
      if (empId !== targetEmployee || s.status !== "active") return false;
      const sFrom = dayjs(s.effectiveFrom);
      const sTo = s.effectiveTo ? dayjs(s.effectiveTo) : null;
      const end = to || dayjs("2099-12-31");
      const sEnd = sTo || dayjs("2099-12-31");
      return from.startOf("day").valueOf() <= sEnd.endOf("day").valueOf() && sFrom.startOf("day").valueOf() <= end.endOf("day").valueOf();
    });
  };

  const handleSubmit = async (values) => {
    if (!validateOverlap(values)) {
      message.warning("Active structure overlap detected for selected employee.");
      return;
    }

    setSaving(true);
    const payload = {
      ...values,
      effectiveFrom: values.effectiveFrom.toISOString(),
      effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : null,
    };

    try {
      if (editingId) {
        await httpClient.put(`/payroll/structure/${editingId}`, payload);
        message.success("Salary structure updated");
      } else {
        await httpClient.post("/payroll/structure", payload);
        message.success("Salary structure created");
      }
      setEditingId(null);
      form.resetFields();
      refreshStructures();
    } catch (error) {
      message.error(error?.response?.data?.message || "Salary structure save failed");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setEditingId(row._id);
    form.setFieldsValue({
      ...row,
      employeeId: row.employeeId?._id || row.employeeId,
      effectiveFrom: row.effectiveFrom ? dayjs(row.effectiveFrom) : null,
      effectiveTo: row.effectiveTo ? dayjs(row.effectiveTo) : null,
    });
  };

  const filteredStructures = useMemo(() => {
    if (!search) return structures;
    return structures.filter((s) => (s.employeeId?.userId?.name || "").toLowerCase().includes(search.toLowerCase()));
  }, [search, structures]);

  return (
    <Layout style={{ padding: 24, minHeight: "100vh", background: "#fff" }}>
      <Breadcrumb style={{ marginBottom: 20 }}>
        <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Payroll</Breadcrumb.Item>
        <Breadcrumb.Item>Salary Structures</Breadcrumb.Item>
      </Breadcrumb>
      <Content>
        {!structures.length && (
          <Alert
            showIcon
            style={{ marginBottom: 16 }}
            type="info"
            message="Structure listing may be unavailable"
            description="Create/edit APIs are fully wired; list/history shows once backend listing endpoint is exposed."
          />
        )}

        <Row gutter={16}>
          <Col xs={24} lg={10}>
            <SalaryStructureForm form={form} employees={employees} onSubmit={handleSubmit} submitting={saving} editingId={editingId} />
          </Col>
          <Col xs={24} lg={14}>
            <Input.Search placeholder="Search employee" onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <SalaryStructureTable data={filteredStructures} loading={loading} onEdit={onEdit} />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default SalaryStructures;

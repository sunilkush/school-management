import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import { fetchSchoolClasses } from "../../../features/schoolClassSlice";
import { currentUser } from "../../../features/authSlice";
import { fetchFeeStructures } from "../../../features/feeStructureSlice";
import {
  assignFeesToStudents,
  fetchMyFees,
} from "../../../features/studentFeeSlice";

const { Text, Title } = Typography;

const safeId = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  if (typeof v === "object" && v.studentId) {
    return typeof v.studentId === "object"
      ? String(v.studentId?._id)
      : String(v.studentId);
  }
  return String(v);
};

const getStudentUserId = (student) => {
  return safeId(student?.studentId);
};
console.log(getStudentUserId)
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getApiMessage = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const msg =
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.payload?.message ||
    err?.message ||
    err?.error;

  return typeof msg === "string" ? msg : fallback;
};

const AssignStudentFee = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const [mode, setMode] = useState("bulk");
  const [selectedFeeIds, setSelectedFeeIds] = useState([]);
  const [customAmounts, setCustomAmounts] = useState({});
  const [studentSearch, setStudentSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const showAlert = (type, message, description = "") => {
    setAlertInfo({ type, message, description });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { schoolStudents: rawSchoolStudents } = useSelector(
    (s) => s.students || {}
  );
  const { schoolClasses: rawSchoolClasses } = useSelector(
    (s) => s.schoolClass || {}
  );
  const { selectedAcademicYear } = useSelector((s) => s.academicYear || {});
  const { user } = useSelector((s) => s.auth || {});
  const { feeStructures: rawFeeStructures, loading } = useSelector(
    (s) => s.feeStructure || {}
  );

  const schoolStudents = useMemo(
    () => (Array.isArray(rawSchoolStudents) ? rawSchoolStudents : []),
    [rawSchoolStudents]
  );

  const schoolClasses = useMemo(
    () => (Array.isArray(rawSchoolClasses) ? rawSchoolClasses : []),
    [rawSchoolClasses]
  );

  const feeStructures = useMemo(
    () => (Array.isArray(rawFeeStructures) ? rawFeeStructures : []),
    [rawFeeStructures]
  );

  const schoolId = user?.school?._id || user?.schoolId || "";

  const selectedStudentId = Form.useWatch("studentId", form);
  const selectedClassId = Form.useWatch("schoolClassId", form);
  const academicYearId = Form.useWatch("academicYearId", form);

 const selectedStudent = useMemo(() => {
  return schoolStudents.find(
    (s) => getStudentUserId(s) === safeId(selectedStudentId)
  );
}, [schoolStudents, selectedStudentId]);

  const effectiveClassId =
    mode === "single"
      ? selectedStudent?.class?._id ||
        selectedStudent?.schoolClass?._id ||
        selectedStudent?.classId ||
        selectedStudent?.schoolClassId ||
        null
      : selectedClassId;

  const selectedClass = useMemo(() => {
    return schoolClasses.find((c) => safeId(c._id) === safeId(effectiveClassId));
  }, [schoolClasses, effectiveClassId]);

  const filteredStudentsForClass = useMemo(() => {
    return schoolStudents.filter((s) => {
      const studentClassId =
        s.class?._id || s.schoolClass?._id || s.classId || s.schoolClassId;

      const matchClass =
        !effectiveClassId || safeId(studentClassId) === safeId(effectiveClassId);

      const name = s.user?.name || s.name || "";
      const email = s.user?.email || s.email || "";
      const regNo = s.registrationNumber || s.regId || "";

      const matchSearch =
        !studentSearch ||
        `${name} ${email} ${regNo}`
          .toLowerCase()
          .includes(studentSearch.toLowerCase());

      return matchClass && matchSearch;
    });
  }, [schoolStudents, effectiveClassId, studentSearch]);

  const selectedFees = useMemo(() => {
    return feeStructures.filter((fee) => selectedFeeIds.includes(fee._id));
  }, [feeStructures, selectedFeeIds]);

  const totalDefaultAmount = useMemo(() => {
    return selectedFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  }, [selectedFees]);

  const totalFinalAmount = useMemo(() => {
    return selectedFees.reduce((sum, fee) => {
      const custom = customAmounts[fee._id];
      return sum + Number(custom ?? fee.amount ?? 0);
    }, 0);
  }, [selectedFees, customAmounts]);

  const targetStudentCount =
    mode === "single" && selectedStudentId ? 1 : filteredStudentsForClass.length;

  useEffect(() => {
    dispatch(currentUser());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedAcademicYear?._id) return;
    form.setFieldsValue({ academicYearId: selectedAcademicYear._id });
  }, [selectedAcademicYear?._id, form]);

  useEffect(() => {
    if (!schoolId) return;

    const params = {
      schoolId,
      ...(selectedAcademicYear?._id && {
        academicYearId: selectedAcademicYear._id,
      }),
      ...(selectedClassId && {
        schoolClassId: selectedClassId,
      }),
    };

    dispatch(fetchStudentsBySchoolId(params));

    dispatch(
      fetchSchoolClasses({
        schoolId,
        ...(selectedAcademicYear?._id && {
          academicYearId: selectedAcademicYear._id,
        }),
      })
    );
  }, [dispatch, schoolId, selectedAcademicYear?._id, selectedClassId]);

  useEffect(() => {
    if (!schoolId || !academicYearId || !effectiveClassId) return;

    dispatch(
      fetchFeeStructures({
        schoolId,
        academicYearId,
        schoolClassId: effectiveClassId,
      })
    );
  }, [dispatch, schoolId, academicYearId, effectiveClassId]);

  useEffect(() => {
    setSelectedFeeIds((prev) =>
      prev.filter((id) => feeStructures.some((fee) => fee._id === id))
    );
  }, [feeStructures]);

  useEffect(() => {
    setSelectedFeeIds([]);
    setCustomAmounts({});
    setAlertInfo(null);
  }, [mode, effectiveClassId, academicYearId]);

  const refreshData = () => {
    if (!schoolId) return;

    const params = {
      schoolId,
      ...(selectedAcademicYear?._id && {
        academicYearId: selectedAcademicYear._id,
      }),
      ...(selectedClassId && {
        schoolClassId: selectedClassId,
      }),
    };

    dispatch(fetchStudentsBySchoolId(params));
    dispatch(fetchSchoolClasses(params));

    if (academicYearId && effectiveClassId) {
      dispatch(
        fetchFeeStructures({
          schoolId,
          academicYearId,
          schoolClassId: effectiveClassId,
        })
      );
    }
  };

 const checkAlreadyAssignedFees = async ({ studentIds, feeIds }) => {
  const duplicateMap = {};

  try {
    // ✅ parallel API calls (fast)
      const responses = await Promise.all(
        studentIds.map((sid) =>
          dispatch(
            fetchMyFees({
              studentId: sid,
              academicYearId: selectedAcademicYear?._id,
            })
          ).unwrap()
        )
      );

    responses.forEach((feesResponse, index) => {
      const studentId = studentIds[index];

      const fees = Array.isArray(feesResponse)
        ? feesResponse
        : Array.isArray(feesResponse?.data)
        ? feesResponse.data
        : [];

      const assignedFeeIds = fees.map((fee) =>
        safeId(fee?.feeStructureId?._id || fee?.feeStructureId)
      );

      duplicateMap[safeId(studentId)] = feeIds.filter((feeId) =>
        assignedFeeIds.includes(safeId(feeId))
      );
    });

    return duplicateMap;
  } catch (err) {
    console.error("Duplicate check failed:", err);
    return {};
  }
};


  const feeColumns = [
    {
      title: "Fee Head",
      key: "feeHead",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.feeHeadId?.name || record.name || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description || "Fee structure"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      width: 140,
      render: (value) => (
        <Tag color="blue">{value ? String(value).toUpperCase() : "-"}</Tag>
      ),
    },
    {
      title: "Default Amount",
      dataIndex: "amount",
      width: 160,
      render: (value) => <Text strong>{money(value)}</Text>,
    },
    {
      title: "Custom Amount",
      width: 190,
      render: (_, record) => (
        <InputNumber
          min={0}
          placeholder="Optional"
          style={{ width: "100%" }}
          value={customAmounts[record._id] ?? null}
          formatter={(value) =>
            value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
          }
          parser={(value) => value?.replace(/[₹,\s]/g, "")}
          onChange={(val) =>
            setCustomAmounts((prev) => ({
              ...prev,
              [record._id]: val,
            }))
          }
        />
      ),
    },
    {
      title: "Final",
      width: 140,
      render: (_, record) => (
        <Text strong type="success">
          {money(customAmounts[record._id] ?? record.amount)}
        </Text>
      ),
    },
  ];

  const previewStudentColumns = [
    {
      title: "Student",
      render: (_, s) => (
        <Space direction="vertical" size={0}>
          <Text strong>{s.user?.name || s.name || "-"}</Text>
          <Text type="secondary">
            {s.registrationNumber || s.regId || "No Reg. No."}
          </Text>
        </Space>
      ),
    },
    {
      title: "Class",
      render: (_, s) => s.class?.name || s.schoolClass?.name || "-",
    },
    {
      title: "Section",
      render: (_, s) => s.section?.name || "-",
    },
  ];

const onFinish = async (values) => {
  setAlertInfo(null);

  try {
    if (!schoolId) {
      showAlert("error", "School Not Found", "Please login again.");
      return;
    }

    if (!values.academicYearId) {
      showAlert("warning", "Academic Year Required");
      return;
    }

    if (!selectedFeeIds.length) {
      showAlert("warning", "Select at least one fee");
      return;
    }

    const payloadBase = {
      schoolId,
      academicYearId : selectedAcademicYear._id
    };

    let studentIdsToAssign = [];

    // ✅ SINGLE
    if (mode === "single") {
      const studentId = safeId(values.studentId);
      if (!studentId) {
        showAlert("warning", "Student Required");
        return;
      }

      payloadBase.studentId = studentId;
      studentIdsToAssign = [studentId];
    }

    // ✅ BULK
    if (mode === "bulk") {
      studentIdsToAssign = filteredStudentsForClass
        .map((s) => getStudentUserId(s))
        .filter(Boolean);

      if (!studentIdsToAssign.length) {
        showAlert("warning", "No students found");
        return;
      }

      payloadBase.studentIds = studentIdsToAssign;
    }

    setAssigning(true);

    // ✅ DUPLICATE CHECK
    const duplicateMap = await checkAlreadyAssignedFees({
      studentIds: studentIdsToAssign,
      feeIds: selectedFeeIds,
    });

    const assignPromises = [];
    let skipped = 0;

    for (const feeStructureId of selectedFeeIds) {
      const pendingStudents = studentIdsToAssign.filter(
        (sid) =>
          !(duplicateMap[safeId(sid)] || []).includes(
            safeId(feeStructureId)
          )
      );

      skipped += studentIdsToAssign.length - pendingStudents.length;

      if (!pendingStudents.length) continue;

      assignPromises.push(
        dispatch(
          assignFeesToStudents({
            ...payloadBase,
            feeStructureId,
            ...(mode === "single"
              ? { studentId: pendingStudents[0] }
              : { studentIds: pendingStudents }),
            customAmount: customAmounts[feeStructureId] ?? null,
          })
        ).unwrap()
      );
    }

    if (!assignPromises.length) {
      showAlert("warning", "Fees already assigned");
      return;
    }

    await Promise.all(assignPromises);

    showAlert(
      skipped > 0 ? "warning" : "success",
      skipped > 0
        ? `Skipped ${skipped} duplicates`
        : "Fees assigned successfully"
    );

    // reset
    form.resetFields();
    setSelectedFeeIds([]);
    setCustomAmounts({});
    setPreviewOpen(false);
    setMode("bulk");

  } catch (err) {
    showAlert(
      "error",
      "Failed",
      getApiMessage(err)
    );
  } finally {
    setAssigning(false);
  }
};

  return (
    <div style={{ padding: 24, background: "#f5f7fb", minHeight: "100vh" }}>
      {alertInfo && (
        <Alert
          style={{
            marginBottom: 16,
            borderRadius: 12,
          }}
          type={alertInfo.type}
          showIcon
          closable
          message={alertInfo.message}
          description={alertInfo.description}
          onClose={() => setAlertInfo(null)}
        />
      )}

          <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card
          bordered={false}
          style={{
            borderRadius: 18,
            boxShadow: "0 10px 30px rgba(37, 99, 235, 0.06)",
          }}
          bodyStyle={{ padding: 24 }}
        >
        
          <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
            <Space direction="vertical" size={2}>
              <Title level={3} style={{ margin: 0 }}>
                Assign Student Fees
              </Title>
              <Text type="secondary">
                Assign fee structures class-wise or to a single student.
              </Text>
            </Space>

            <Space wrap>
              <Tooltip title="Refresh data">
                <Button icon={<ReloadOutlined />} onClick={refreshData}>
                  Refresh
                </Button>
              </Tooltip>

              <Button
                icon={<EyeOutlined />}
                disabled={!selectedFeeIds.length}
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </Button>

              <Button
                type="primary"
                htmlType="submit"
                loading={assigning}
                disabled={!selectedFeeIds.length || !targetStudentCount}
                icon={<CheckCircleOutlined />}
              >
                Assign Fee
              </Button>
            </Space>
          </Flex>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#F8FAFC" }}>
                <Statistic
                  title="Target Students"
                  value={targetStudentCount}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#F8FAFC" }}>
                <Statistic
                  title="Selected Fees"
                  value={selectedFeeIds.length}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#F8FAFC" }}>
                <Statistic
                  title="Default Total"
                  value={money(totalDefaultAmount)}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} style={{ background: "#F8FAFC" }}>
                <Statistic title="Final Total" value={money(totalFinalAmount)} />
              </Card>
            </Col>
          </Row>
        </Card>

        <Row gutter={[18, 18]} style={{ marginTop: 18 }}>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <FilterOutlined />
                  Filters
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 18,
                boxShadow: "0 10px 30px rgba(37, 99, 235, 0.06)",
              }}
            >
              <Form.Item label="Assignment Mode">
                <Radio.Group
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    form.setFieldsValue({
                      studentId: undefined,
                      schoolClassId: undefined,
                    });
                  }}
                  buttonStyle="solid"
                  style={{ width: "100%" }}
                >
                  <Radio.Button
                    value="bulk"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    Bulk
                  </Radio.Button>
                  <Radio.Button
                    value="single"
                    style={{ width: "50%", textAlign: "center" }}
                  >
                    Single
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="academicYearId"
                label="Academic Year"
                rules={[{ required: true, message: "Please select academic year" }]}
              >
                <Select placeholder="Select Academic Year">
                  {selectedAcademicYear?._id && (
                    <Select.Option
                      key={selectedAcademicYear._id}
                      value={selectedAcademicYear._id}
                    >
                      {selectedAcademicYear.name || selectedAcademicYear.year}
                    </Select.Option>
                  )}
                </Select>
              </Form.Item>

              {mode === "bulk" && (
                <Form.Item
                  name="schoolClassId"
                  label="Class"
                  rules={[{ required: true, message: "Please select class" }]}
                >
                  <Select
                    placeholder="Select Class"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                  >
                    {schoolClasses.map((c) => (
                      <Select.Option key={c._id} value={c._id}>
                        {c.name || c.boardClassId?.name || "Unnamed Class"}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {mode === "single" && (
                <Form.Item
                  name="studentId"
                  label="Student"
                  rules={[{ required: true, message: "Please select student" }]}
                >
                  <Select
                    placeholder="Select Student"
                    showSearch
                    allowClear
                    optionFilterProp="label"
                   options={schoolStudents.map((s) => ({
                      value: getStudentUserId(s), // ✅ studentId only
                      label: `${s.user?.name || s.name || "-"} ${
                        s.registrationNumber || ""
                      } (${s.class?.name || s.schoolClass?.name || "-"} - ${
                        s.section?.name || "-"
                      })`,
                    }))}
                  />
                </Form.Item>
              )}

              {mode === "bulk" && (
                <Form.Item label="Search Students">
                  <Input
                    allowClear
                    placeholder="Search by name, email, reg no."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              )}

              <Alert
                type={effectiveClassId ? "success" : "info"}
                showIcon
                message={
                  effectiveClassId
                    ? `Selected: ${selectedClass?.name || "Class selected"}`
                    : "Select class/student to load fee structures"
                }
              />
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  Fee Structures
                  <Badge count={feeStructures.length} color="blue" />
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: 18,
                boxShadow: "0 10px 30px rgba(37, 99, 235, 0.06)",
              }}
            >
              {!effectiveClassId ? (
                <Empty description="Select class or student to load fee structures" />
              ) : (
                <Table
                  rowKey="_id"
                  columns={feeColumns}
                  dataSource={feeStructures}
                  loading={loading}
                  scroll={{ x: 900 }}
                  rowSelection={{
                    selectedRowKeys: selectedFeeIds,
                    onChange: (keys) => setSelectedFeeIds(keys),
                  }}
                  pagination={{
                    pageSize: 8,
                    showSizeChanger: true,
                    pageSizeOptions: [8, 15, 30],
                  }}
                  locale={{
                    emptyText:
                      "No fee structure found for selected class and academic year",
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Form>

      <Drawer
        title="Assignment Preview"
        width={720}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        extra={
          <Button
            type="primary"
            loading={assigning}
            disabled={!selectedFeeIds.length || !targetStudentCount}
            onClick={() => form.submit()}
          >
            Confirm Assign
          </Button>
        }
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Review before assigning"
            description={`You are assigning ${selectedFeeIds.length} fee structure(s) to ${targetStudentCount} student(s).`}
          />

          <Card size="small" title="Selected Fees">
            <Table
              rowKey="_id"
              size="small"
              pagination={false}
              dataSource={selectedFees}
              columns={[
                {
                  title: "Fee Head",
                  render: (_, r) => r.feeHeadId?.name || r.name || "-",
                },
                {
                  title: "Frequency",
                  render: (_, r) =>
                    r.frequency ? String(r.frequency).toUpperCase() : "-",
                },
                {
                  title: "Amount",
                  render: (_, r) => money(customAmounts[r._id] ?? r.amount),
                },
              ]}
            />
          </Card>

          <Card size="small" title="Target Students">
            {mode === "single" ? (
              <Alert
                type="success"
                showIcon
                message={String(
                  selectedStudent?.user?.name || selectedStudent?.name || "-"
                )}
                description={`Class: ${
                  selectedStudent?.class?.name ||
                  selectedStudent?.schoolClass?.name ||
                  "-"
                }, Section: ${selectedStudent?.section?.name || "-"}`}
              />
            ) : (
              <Table
                rowKey="_id"
                size="small"
                columns={previewStudentColumns}
                dataSource={filteredStudentsForClass}
                pagination={{ pageSize: 6 }}
              />
            )}
          </Card>
        </Space>
      </Drawer>
    </div>
  );
};

export default AssignStudentFee;
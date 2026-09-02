import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Empty, Popconfirm, Select, Skeleton, Space, Table, Tabs, Tag,
  Typography, message,
} from "antd";
import { SwapOutlined, UserSwitchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, toolbarRow, pill } from "../../styles/pageStyles";
import httpClient from "../../api/httpClient";
import {
  fetchSubstitutionPlan, assignSubstitute, fetchSubstitutions, cancelSubstitution,
} from "../../services/substitutionApi";

const { Text } = Typography;

const fmtDate = (d) => dayjs(d).format("YYYY-MM-DD");

export default function SubstitutionsPage() {
  const { user } = useSelector((s) => s.auth || {});
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear?.selectedAcademicYear || s.academicYear?.activeYear
  );
  const academicYearId = selectedAcademicYear?._id || user?.school?.activeAcademicYearId;

  const [date, setDate] = useState(dayjs());
  const [plan, setPlan] = useState(null);
  const [register, setRegister] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyRow, setBusyRow] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [adHocAbsent, setAdHocAbsent] = useState([]);
  const [picked, setPicked] = useState({});   // timetableId -> chosen substitute

  // Teacher list for the "also absent today" picker.
  useEffect(() => {
    httpClient
      .get("/user/getAllUser", { params: { role: "Teacher", limit: 500 } })
      .then((res) => {
        const list = res.data?.data?.users || res.data?.data || [];
        setTeachers(Array.isArray(list) ? list : []);
      })
      .catch(() => setTeachers([]));
  }, []);

  const load = useCallback(async () => {
    if (!academicYearId) return;
    setLoading(true);
    try {
      const [planData, registerData] = await Promise.all([
        fetchSubstitutionPlan({ date: fmtDate(date), academicYearId, absentTeacherIds: adHocAbsent }),
        fetchSubstitutions({ date: fmtDate(date) }),
      ]);
      setPlan(planData);
      setRegister(registerData);
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not load the day's substitutions");
    } finally {
      setLoading(false);
    }
  }, [academicYearId, date, adHocAbsent]);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (period) => {
    const substituteTeacherId = picked[period.timetableId];
    if (!substituteTeacherId) {
      message.warning("Pick a substitute first");
      return;
    }
    setBusyRow(period.timetableId);
    try {
      await assignSubstitute({
        date: fmtDate(date),
        academicYearId,
        timetableId: period.timetableId,
        substituteTeacherId,
      });
      message.success("Substitute assigned — both teachers notified");
      setPicked((prev) => ({ ...prev, [period.timetableId]: undefined }));
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not assign");
    } finally {
      setBusyRow(null);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelSubstitution(id);
      message.success("Substitution cancelled");
      load();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not cancel");
    }
  };

  const planColumns = [
    {
      title: "Period",
      render: (_, r) => (
        <div>
          <Text strong>{r.slotName || "Period"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {[r.className, r.sectionName].filter(Boolean).join(" — ") || "Class"}
          </Text>
        </div>
      ),
    },
    { title: "Subject", dataIndex: "subjectName", render: (v) => v || "—" },
    {
      title: "Absent",
      render: (_, r) => {
        const t = teachers.find((x) => String(x._id) === String(r.absentTeacherId));
        return (
          <Space direction="vertical" size={0}>
            <Text>{t?.name || "Teacher"}</Text>
            {r.leaveRequestId ? <Tag color="blue">On leave</Tag> : <Tag>Marked absent</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Cover",
      width: 320,
      render: (_, r) => {
        if (r.assigned) {
          return (
            <Space>
              <span style={pill("var(--success)")}>{r.assigned.substituteName || "Assigned"}</span>
              <Popconfirm title="Cancel this cover?" onConfirm={() => handleCancel(r.assigned.substitutionId)}>
                <Button size="small" danger type="text">Cancel</Button>
              </Popconfirm>
            </Space>
          );
        }
        if (!r.candidates?.length) {
          return <Text type="danger" style={{ fontSize: 12 }}>No free teacher for this slot</Text>;
        }
        return (
          <Space.Compact style={{ width: "100%" }}>
            <Select
              style={{ minWidth: 200, flex: 1 }}
              placeholder="Choose a substitute"
              value={picked[r.timetableId]}
              onChange={(v) => setPicked((prev) => ({ ...prev, [r.timetableId]: v }))}
              options={r.candidates.map((c) => ({
                value: c.teacherId,
                label: `${c.name}${c.teachesSubject ? " · same subject" : ""} · ${c.periodsThatDay} periods today`,
              }))}
            />
            <Button
              type="primary"
              loading={busyRow === r.timetableId}
              onClick={() => handleAssign(r)}
            >
              Assign
            </Button>
          </Space.Compact>
        );
      },
    },
  ];

  const registerColumns = [
    { title: "Period", render: (_, r) => r.timeSlotId?.name || "—" },
    {
      title: "Class",
      render: (_, r) => [r.schoolClassId?.name, r.sectionId?.name].filter(Boolean).join(" — ") || "—",
    },
    { title: "Subject", render: (_, r) => r.subjectId?.name || "—" },
    { title: "Absent", render: (_, r) => r.absentTeacherId?.name || "—" },
    { title: "Covered by", render: (_, r) => <Text strong>{r.substituteTeacherId?.name || "—"}</Text> },
    {
      title: "",
      align: "right",
      render: (_, r) => (
        <Popconfirm title="Cancel this cover?" onConfirm={() => handleCancel(r._id)}>
          <Button size="small" danger type="text">Cancel</Button>
        </Popconfirm>
      ),
    },
  ];

  const uncovered = (plan?.periods || []).filter((p) => !p.assigned).length;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Substitutions"
        subtitle="Cover the periods left open by absent teachers — for one day only, without touching the weekly timetable."
        icon={<UserSwitchOutlined />}
      />

      {!academicYearId && (
        <Alert type="warning" showIcon message="Select an academic year first" style={{ marginBottom: 16 }} />
      )}

      <div style={sectionPanel}>
        <div style={toolbarRow}>
          <DatePicker value={date} onChange={(d) => d && setDate(d)} allowClear={false} format="DD MMM YYYY" />
          <Select
            mode="multiple"
            allowClear
            style={{ minWidth: 260 }}
            placeholder="Also absent today (no leave on record)"
            value={adHocAbsent}
            onChange={setAdHocAbsent}
            optionFilterProp="label"
            options={teachers.map((t) => ({ value: t._id, label: t.name }))}
          />
          <Button icon={<SwapOutlined />} onClick={load} loading={loading}>Refresh</Button>
          {plan && (
            <Space style={{ marginLeft: "auto" }}>
              <span style={pill("var(--primary)")}>{plan.dayOfWeek}</span>
              <span style={pill(uncovered ? "var(--warning)" : "var(--success)")}>
                {uncovered ? `${uncovered} uncovered` : "All covered"}
              </span>
            </Space>
          )}
        </div>

        <Tabs
          defaultActiveKey="plan"
          items={[
            {
              key: "plan",
              label: `Needs cover${uncovered ? ` (${uncovered})` : ""}`,
              children: loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : !plan?.periods?.length ? (
                <Empty description="Nobody is away — no periods need cover today" />
              ) : (
                <Table
                  size="small"
                  rowKey="timetableId"
                  columns={planColumns}
                  dataSource={plan.periods}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
              ),
            },
            {
              key: "register",
              label: `Today's register${register.length ? ` (${register.length})` : ""}`,
              children: !register.length ? (
                <Empty description="No cover arranged for this date yet" />
              ) : (
                <Table
                  size="small"
                  rowKey="_id"
                  columns={registerColumns}
                  dataSource={register}
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              ),
            },
          ]}
        />
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 12 }}
        message="Cover is for this date only"
        description="Assigning a substitute does not change the weekly timetable — next week's schedule keeps the original teacher. Candidates exclude anyone already teaching in that slot, already covering another class, or away themselves."
      />
    </div>
  );
}

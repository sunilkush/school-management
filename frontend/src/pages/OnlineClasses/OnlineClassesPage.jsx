import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert, Button, DatePicker, Drawer, Empty, Form, Input, InputNumber, Modal,
  Popconfirm, Select, Spin, Table, Tag, Tooltip, message,
} from "antd";
import {
  CheckSquareOutlined, ClockCircleOutlined, PlayCircleOutlined, PlusOutlined,
  ReloadOutlined, StopOutlined, TeamOutlined, VideoCameraOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  cancelOnlineClass, clearJoins, createOnlineClass, fetchJoins, fetchOnlineClasses,
  joinOnlineClass, markAttendanceFromJoins, setOnlineClassStatus, updateOnlineClass,
} from "../../features/onlineClassSlice";
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { fetchSections } from "../../features/sectionSlice";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const PROVIDERS = [
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "jitsi", label: "Jitsi" },
  { value: "other", label: "Other" },
];

const STATUS_COLOR = {
  scheduled: "var(--accent)",
  live: "var(--success)",
  completed: "var(--text-muted)",
  cancelled: "var(--danger)",
};

/**
 * One screen for everybody, because the class is the same object whoever is looking at it — a
 * teacher sees the schedule and the join log, a student sees a join button that only lights up
 * when the link is actually open.
 */
const OnlineClassesPage = ({ canHost = false }) => {
  const dispatch = useDispatch();
  const { classes, loading, joins, joinsLoading, actionLoading } = useSelector((s) => s.onlineClass || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections = [] } = useSelector((s) => s.section || {});
  const activeYearId = useSelector((s) => s.auth?.user?.school?.activeAcademicYearId || null);

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [range, setRange] = useState([dayjs().startOf("day"), dayjs().add(14, "day")]);
  const [joinsFor, setJoinsFor] = useState(null);

  const load = () => {
    const params = {};
    if (range?.length === 2) {
      params.from = range[0].startOf("day").toISOString();
      params.to = range[1].endOf("day").toISOString();
    }
    dispatch(fetchOnlineClasses(params));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, range]);

  // Only the host needs the pickers; a student never schedules anything.
  useEffect(() => {
    if (canHost) dispatch(fetchSchoolClasses(activeYearId ? { academicYearId: activeYearId } : {}));
  }, [dispatch, canHost, activeYearId]);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      provider: "google_meet",
      linkVisibleBeforeMin: 15,
      window: [dayjs().add(1, "hour").startOf("hour"), dayjs().add(2, "hour").startOf("hour")],
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      provider: row.provider,
      meetingLink: row.meetingLink,
      meetingId: row.meetingId,
      passcode: row.passcode,
      linkVisibleBeforeMin: row.linkVisibleBeforeMin,
      recordingUrl: row.recordingUrl,
      window: [dayjs(row.scheduledStart), dayjs(row.scheduledEnd)],
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const [start, end] = values.window || [];
    const payload = {
      ...values,
      window: undefined,
      scheduledStart: start?.toISOString(),
      scheduledEnd: end?.toISOString(),
    };

    const res = await dispatch(editing ? updateOnlineClass({ id: editing._id, ...payload }) : createOnlineClass(payload));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editing ? "Class updated" : "Class scheduled");
      setModalOpen(false);
      load();
    } else {
      message.error(res.payload || "Could not save the class");
    }
  };

  const openLink = async (row) => {
    const res = await dispatch(joinOnlineClass(row._id));
    if (joinOnlineClass.fulfilled.match(res)) {
      window.open(res.payload.meetingLink, "_blank", "noopener,noreferrer");
      load();
    } else {
      message.error(res.payload || "Could not open the class");
    }
  };

  const changeStatus = async (row, status) => {
    const res = await dispatch(setOnlineClassStatus({ id: row._id, status }));
    if (setOnlineClassStatus.fulfilled.match(res)) { message.success(`Marked ${status}`); load(); }
    else message.error(res.payload || "Could not update");
  };

  const cancel = async (row) => {
    const res = await dispatch(cancelOnlineClass({ id: row._id, reason: "" }));
    if (cancelOnlineClass.fulfilled.match(res)) { message.success("Class cancelled"); load(); }
    else message.error(res.payload || "Could not cancel");
  };

  const showJoins = (row) => {
    setJoinsFor(row);
    dispatch(fetchJoins(row._id));
  };

  const markRegister = async () => {
    const res = await dispatch(markAttendanceFromJoins(joinsFor._id));
    if (markAttendanceFromJoins.fulfilled.match(res)) {
      const { marked, skipped } = res.payload || {};
      message.success(skipped?.length
        ? `${marked} marked present, ${skipped.length} left as they were`
        : `${marked} student(s) marked present`);
    } else {
      message.error(res.payload || "Could not mark the register");
    }
  };

  const upcoming = useMemo(
    () => (classes || []).filter((c) => c.status === "scheduled" || c.status === "live").length,
    [classes]
  );

  const columns = [
    {
      title: "Class", dataIndex: "title",
      render: (title, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.schoolClassId?.name || ""}{r.sectionId?.name ? ` · ${r.sectionId.name}` : " · all sections"}
            {r.subjectId?.name ? ` · ${r.subjectId.name}` : ""}
            {r.teacherId?.name ? ` · ${r.teacherId.name}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "When", width: 210,
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <div>{dayjs(r.scheduledStart).format("ddd D MMM, h:mm A")}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            to {dayjs(r.scheduledEnd).format("h:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Status", dataIndex: "status", width: 120,
      render: (status) => <span style={pill(STATUS_COLOR[status] || "var(--text-muted)")}>{status}</span>,
    },
    {
      title: "", width: canHost ? 300 : 170, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {r.status !== "cancelled" && (
            <Tooltip title={r.canJoin === false ? `Opens ${dayjs(r.joinOpensAt).format("D MMM, h:mm A")}` : "Open the meeting"}>
              <Button
                type="primary" size="small" icon={<VideoCameraOutlined />}
                disabled={r.canJoin === false}
                loading={actionLoading}
                onClick={() => openLink(r)}
              >
                Join
              </Button>
            </Tooltip>
          )}
          {canHost && r.status === "scheduled" && (
            <Button size="small" icon={<PlayCircleOutlined />} onClick={() => changeStatus(r, "live")}>Live</Button>
          )}
          {canHost && r.status === "live" && (
            <Button size="small" onClick={() => changeStatus(r, "completed")}>End</Button>
          )}
          {canHost && (
            <Button size="small" icon={<TeamOutlined />} onClick={() => showJoins(r)}>Joins</Button>
          )}
          {canHost && r.status !== "cancelled" && r.status !== "completed" && (
            <>
              <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
              <Popconfirm title="Cancel this class?" onConfirm={() => cancel(r)}>
                <Button size="small" danger icon={<StopOutlined />} />
              </Popconfirm>
            </>
          )}
          {r.recordingUrl && (
            <Button size="small" href={r.recordingUrl} target="_blank" rel="noreferrer">Recording</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("live-class-table")}</style>

      <PageHeader
        title="Online Classes"
        subtitle={canHost ? "Schedule live classes and see who joined" : "Your live classes"}
        icon={<VideoCameraOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RangePicker value={range} onChange={(v) => setRange(v || [])} />
            <Button icon={<ReloadOutlined />} onClick={load} />
            {canHost && <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Schedule class</Button>}
          </div>
        }
      />

      {canHost && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message="Use the meeting tool the school already has"
          description="Paste a Meet, Zoom, Teams or Jitsi link. Nothing here hosts the video — this handles who the class is for, when the link becomes visible, who opened it, and where the recording went."
        />
      )}

      {loading && !classes?.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !classes?.length ? (
        <div style={emptyState}>
          <Empty description="No online classes in this period" />
          {canHost && (
            <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={openAdd}>
              Schedule one
            </Button>
          )}
        </div>
      ) : (
        <div style={sectionPanel}>
          <div style={{ marginBottom: 12, color: "var(--text-muted)", fontSize: 13 }}>
            <ClockCircleOutlined /> {upcoming} upcoming in this period
          </div>
          <div style={tableContainer}>
            <Table
              className="live-class-table" rowKey="_id" size="middle"
              columns={columns} dataSource={classes}
              pagination={{ pageSize: 20, showSizeChanger: false }}
            />
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        width={640}
        title={editing ? "Edit online class" : "Schedule an online class"}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={actionLoading}
        okText={editing ? "Save" : "Schedule"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editing && (
            <>
              <Form.Item name="schoolClassId" label="Class" rules={[{ required: true, message: "Pick the class" }]}>
                <Select
                  showSearch optionFilterProp="label" placeholder="Which class?"
                  options={schoolClasses.map((c) => ({ value: c._id, label: c.name }))}
                  onChange={(value) => {
                    form.setFieldsValue({ sectionId: undefined });
                    dispatch(fetchSections({ schoolClassId: value }));
                  }}
                />
              </Form.Item>
              <Form.Item name="sectionId" label="Section" extra="Leave blank to reach every section of the class.">
                <Select
                  allowClear showSearch optionFilterProp="label" placeholder="All sections"
                  options={sections.map((sec) => ({ value: sec._id, label: sec.name }))}
                />
              </Form.Item>
            </>
          )}

          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Give the class a title" }]}>
            <Input placeholder="Algebra revision" />
          </Form.Item>

          <Form.Item name="window" label="When" rules={[{ required: true, message: "Pick a start and end time" }]}>
            <DatePicker.RangePicker showTime format="D MMM YYYY, h:mm A" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="provider" label="Meeting tool">
            <Select options={PROVIDERS} />
          </Form.Item>

          <Form.Item
            name="meetingLink" label="Meeting link"
            rules={[{ required: true, message: "Paste the meeting link" }]}
            extra="The link from your own Meet/Zoom/Teams account."
          >
            <Input placeholder="https://meet.google.com/abc-defg-hij" />
          </Form.Item>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="passcode" label="Passcode" style={{ flex: 1 }}>
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item
              name="linkVisibleBeforeMin" label="Show link this many minutes early"
              extra="A link visible for days gets forwarded outside the school."
              style={{ width: 220 }}
            >
              <InputNumber min={0} max={1440} style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Notes for students">
            <TextArea rows={2} />
          </Form.Item>

          {editing && (
            <Form.Item name="recordingUrl" label="Recording link" extra="Added after the class.">
              <Input placeholder="https://..." />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        width={620}
        open={!!joinsFor}
        onClose={() => { setJoinsFor(null); dispatch(clearJoins()); }}
        title={joinsFor ? `Who joined — ${joinsFor.title}` : "Joins"}
        extra={
          <Button icon={<CheckSquareOutlined />} loading={actionLoading} onClick={markRegister}>
            Mark these present
          </Button>
        }
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="These are link opens, not verified attendance"
          description="The video call itself is outside this system, so this shows who clicked join — not who sat through the lesson. Check it before marking the register; a record already entered by hand is left alone."
        />

        {joinsLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : (
          <Table
            rowKey="_id" size="small" pagination={false}
            dataSource={joins?.joins || []}
            locale={{ emptyText: "Nobody opened the link" }}
            columns={[
              { title: "Name", render: (_, r) => r.userId?.name || "—" },
              { title: "Opened at", dataIndex: "firstJoinedAt", width: 150, render: (d) => dayjs(d).format("h:mm A") },
              {
                title: "", width: 110,
                render: (_, r) =>
                  r.minutesAfterStart > 5 ? <Tag color="orange">{r.minutesAfterStart} min late</Tag> : null,
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};

export default OnlineClassesPage;

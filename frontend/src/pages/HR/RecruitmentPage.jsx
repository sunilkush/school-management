import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, DatePicker, Drawer, Empty, Form, Input, InputNumber, Modal, Popconfirm,
  Select, Spin, Steps, Table, Tag, Timeline, Tooltip, message,
} from "antd";
import {
  DeleteOutlined, PlusOutlined, ReloadOutlined, SolutionOutlined, UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createApplication, createPosting, deletePosting, fetchApplications, fetchPipeline,
  fetchPostings, moveApplication, reopenApplication, updatePosting,
} from "../../features/hrSlice";
import PageHeader from "../../components/layout/PageHeader";
import StatCardsRow from "../../components/layout/StatCardsRow";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

const { TextArea } = Input;

/** The pipeline in order. Terminal stages sit apart because you do not move on from them. */
const STAGES = ["applied", "shortlisted", "interview", "demo_class", "offered", "hired"];
const TERMINAL = ["hired", "rejected", "withdrawn"];

const STAGE_LABEL = {
  applied: "Applied", shortlisted: "Shortlisted", interview: "Interview",
  demo_class: "Demo class", offered: "Offered", hired: "Hired",
  rejected: "Rejected", withdrawn: "Withdrawn",
};

const STAGE_COLOR = {
  applied: "var(--text-secondary)", shortlisted: "var(--accent)", interview: "var(--cyan)",
  demo_class: "var(--purple)", offered: "var(--warning)", hired: "var(--success)",
  rejected: "var(--danger)", withdrawn: "var(--text-muted)",
};

const POSTING_STATUS_COLOR = {
  draft: "var(--text-muted)", open: "var(--success)", on_hold: "var(--warning)",
  closed: "var(--text-secondary)", filled: "var(--accent)",
};

const RecruitmentPage = () => {
  const dispatch = useDispatch();
  const { postings, postingsLoading, applications, applicationsLoading, pipeline, actionLoading } =
    useSelector((s) => s.hr || {});

  const [postingForm] = Form.useForm();
  const [candidateForm] = Form.useForm();
  const [moveForm] = Form.useForm();

  const [postingModal, setPostingModal] = useState(false);
  const [editingPosting, setEditingPosting] = useState(null);
  const [candidateModal, setCandidateModal] = useState(false);
  const [openCandidate, setOpenCandidate] = useState(null);
  const [moving, setMoving] = useState(null);
  const [postingFilter, setPostingFilter] = useState(null);

  const load = () => {
    dispatch(fetchPostings());
    dispatch(fetchPipeline());
    dispatch(fetchApplications(postingFilter ? { jobPostingId: postingFilter } : {}));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, postingFilter]);

  const openPosting = (posting = null) => {
    setEditingPosting(posting);
    postingForm.resetFields();
    if (posting) {
      postingForm.setFieldsValue({
        ...posting,
        requirements: (posting.requirements || []).join("\n"),
        closesAt: posting.closesAt ? dayjs(posting.closesAt) : null,
      });
    } else {
      postingForm.setFieldsValue({ employmentType: "Full Time", openings: 1 });
    }
    setPostingModal(true);
  };

  const savePosting = async () => {
    const values = await postingForm.validateFields();
    const payload = {
      ...values,
      requirements: (values.requirements || "").split("\n").map((r) => r.trim()).filter(Boolean),
      closesAt: values.closesAt ? values.closesAt.toISOString() : null,
    };
    const res = await dispatch(editingPosting ? updatePosting({ id: editingPosting._id, ...payload }) : createPosting(payload));
    if (res.type.endsWith("/fulfilled")) {
      message.success(editingPosting ? "Vacancy updated" : "Vacancy created as a draft");
      setPostingModal(false);
      load();
    } else {
      message.error(res.payload || "Could not save the vacancy");
    }
  };

  const setStatus = async (posting, status) => {
    const res = await dispatch(updatePosting({ id: posting._id, status }));
    if (updatePosting.fulfilled.match(res)) { message.success(`Marked ${status}`); load(); }
    else message.error(res.payload || "Could not update");
  };

  const removePosting = async (posting) => {
    const res = await dispatch(deletePosting(posting._id));
    if (deletePosting.fulfilled.match(res)) { message.success("Vacancy deleted"); load(); }
    else message.error(res.payload || "Could not delete");
  };

  const saveCandidate = async () => {
    const values = await candidateForm.validateFields();
    const res = await dispatch(createApplication(values));
    if (createApplication.fulfilled.match(res)) {
      message.success("Candidate recorded");
      setCandidateModal(false);
      candidateForm.resetFields();
      load();
    } else {
      message.error(res.payload || "Could not record the candidate");
    }
  };

  const doMove = async () => {
    const values = await moveForm.validateFields();
    const res = await dispatch(moveApplication({
      id: moving._id,
      stage: values.stage,
      note: values.note,
      rating: values.rating ?? null,
      scheduledFor: values.scheduledFor ? values.scheduledFor.toISOString() : null,
    }));
    if (moveApplication.fulfilled.match(res)) {
      message.success(`Moved to ${STAGE_LABEL[values.stage]}`);
      setMoving(null);
      moveForm.resetFields();
      load();
    } else {
      message.error(res.payload || "Could not move the candidate");
    }
  };

  const doReopen = async (application) => {
    const res = await dispatch(reopenApplication({ id: application._id, note: "Reopened" }));
    if (reopenApplication.fulfilled.match(res)) { message.success("Reopened"); load(); }
    else message.error(res.payload || "Could not reopen");
  };

  const postingOptions = useMemo(
    () => (postings || []).map((p) => ({ value: p._id, label: `${p.title} (${p.status})` })),
    [postings]
  );

  const postingColumns = [
    {
      title: "Vacancy", dataIndex: "title",
      render: (title, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.employmentType} · {r.openings} opening{r.openings > 1 ? "s" : ""}
            {r.departmentId?.name ? ` · ${r.departmentId.name}` : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Candidates", width: 190,
      render: (_, r) => (
        <div style={{ fontSize: 13 }}>
          <b>{r.applicants?.active ?? 0}</b> in the running
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.applicants?.total ?? 0} applied · {r.applicants?.hired ?? 0} hired
          </div>
        </div>
      ),
    },
    {
      title: "Closes", dataIndex: "closesAt", width: 120,
      render: (d) => (d ? dayjs(d).format("D MMM YYYY") : "—"),
    },
    {
      title: "Status", dataIndex: "status", width: 110,
      render: (status) => <span style={pill(POSTING_STATUS_COLOR[status])}>{status.replace("_", " ")}</span>,
    },
    {
      title: "", width: 240, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {r.status === "draft" && <Button size="small" type="primary" onClick={() => setStatus(r, "open")}>Open</Button>}
          {r.status === "open" && <Button size="small" onClick={() => setStatus(r, "closed")}>Close</Button>}
          <Button size="small" onClick={() => openPosting(r)}>Edit</Button>
          <Button size="small" onClick={() => setPostingFilter(r._id)}>Candidates</Button>
          <Popconfirm
            title="Delete this vacancy?"
            description="Only possible while nobody has applied."
            onConfirm={() => removePosting(r)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const applicationColumns = [
    {
      title: "Candidate", dataIndex: "candidateName",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.email}{r.experienceYears ? ` · ${r.experienceYears} yr exp` : ""}
            {r.currentEmployer ? ` · ${r.currentEmployer}` : ""}
          </div>
        </div>
      ),
    },
    { title: "For", width: 170, render: (_, r) => r.jobPostingId?.title || "—" },
    {
      title: "Stage", dataIndex: "stage", width: 130,
      render: (stage) => <span style={pill(STAGE_COLOR[stage])}>{STAGE_LABEL[stage]}</span>,
    },
    {
      title: "", width: 220, align: "right",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Button size="small" onClick={() => setOpenCandidate(r)}>History</Button>
          {TERMINAL.includes(r.stage) ? (
            <Button size="small" onClick={() => doReopen(r)}>Reopen</Button>
          ) : (
            <Button size="small" type="primary" onClick={() => { setMoving(r); moveForm.resetFields(); }}>Move</Button>
          )}
          {r.resumeUrl && <Button size="small" href={r.resumeUrl} target="_blank" rel="noreferrer">CV</Button>}
        </div>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("hr-table")}</style>

      <PageHeader
        title="Recruitment"
        subtitle="Vacancies, candidates, and where each one has got to"
        icon={<SolutionOutlined />}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button icon={<UserAddOutlined />} onClick={() => { candidateForm.resetFields(); setCandidateModal(true); }}>
              Add candidate
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openPosting()}>New vacancy</Button>
          </div>
        }
      />

      <StatCardsRow
        items={[
          { key: "open", icon: <SolutionOutlined />, label: "Open vacancies", value: pipeline?.postings ?? 0, color: "var(--accent)" },
          { key: "seats", icon: <SolutionOutlined />, label: "Still to fill", value: pipeline?.stillToFill ?? 0, color: "var(--warning)" },
          { key: "active", icon: <UserAddOutlined />, label: "In the running", value: pipeline?.active ?? 0, color: "var(--cyan)" },
          { key: "hired", icon: <UserAddOutlined />, label: "Hired", value: pipeline?.hired ?? 0, color: "var(--success)" },
        ]}
      />

      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Vacancies</div>
        {postingsLoading && !postings?.length ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin /></div>
        ) : !postings?.length ? (
          <div style={emptyState}>
            <Empty description="No vacancies yet" />
            <Button type="primary" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => openPosting()}>
              Create the first one
            </Button>
          </div>
        ) : (
          <div style={tableContainer}>
            <Table className="hr-table" rowKey="_id" size="middle" pagination={false}
                   columns={postingColumns} dataSource={postings} />
          </div>
        )}
      </div>

      <div style={sectionPanel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Candidates</div>
          <Select
            allowClear placeholder="All vacancies" style={{ minWidth: 240 }}
            value={postingFilter} onChange={setPostingFilter} options={postingOptions}
          />
        </div>
        <div style={tableContainer}>
          <Table
            className="hr-table" rowKey="_id" size="middle" loading={applicationsLoading}
            columns={applicationColumns} dataSource={applications}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            locale={{ emptyText: "Nobody has applied yet" }}
          />
        </div>
      </div>

      {/* ── Vacancy ── */}
      <Modal
        open={postingModal} width={620}
        title={editingPosting ? `Edit — ${editingPosting.title}` : "New vacancy"}
        onCancel={() => setPostingModal(false)} onOk={savePosting}
        confirmLoading={actionLoading} okText={editingPosting ? "Save" : "Create draft"}
      >
        <Form form={postingForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Job title" rules={[{ required: true, message: "A title is required" }]}>
            <Input placeholder="PGT Mathematics" />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="employmentType" label="Type" style={{ flex: 1 }}>
              <Select options={["Full Time", "Part Time", "Contract", "Temporary", "Visiting"].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
            <Form.Item name="openings" label="Openings" style={{ width: 130 }}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="closesAt" label="Closes on" style={{ width: 170 }}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="requirements" label="Requirements" extra="One per line.">
            <TextArea rows={3} placeholder={"B.Ed\n5 years teaching CBSE\nFluent English"} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="salaryMin" label="Salary from" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="salaryMax" label="Salary to" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ── Candidate ── */}
      <Modal
        open={candidateModal} width={600} title="Add a candidate"
        onCancel={() => setCandidateModal(false)} onOk={saveCandidate}
        confirmLoading={actionLoading} okText="Add"
      >
        <Form form={candidateForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="jobPostingId" label="Applying for" rules={[{ required: true, message: "Pick the vacancy" }]}>
            <Select showSearch optionFilterProp="label" options={postingOptions} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="candidateName" label="Name" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="experienceYears" label="Experience (years)" style={{ width: 170 }}>
              <InputNumber min={0} max={60} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="qualification" label="Qualification">
            <Input placeholder="M.Sc Mathematics, B.Ed" />
          </Form.Item>
          <Form.Item name="currentEmployer" label="Currently at">
            <Input />
          </Form.Item>
          <Form.Item name="resumeUrl" label="CV link" extra="A link to the CV where it already lives — Drive, email, anywhere.">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Move stage ── */}
      <Modal
        open={!!moving} title={`Move ${moving?.candidateName || ""}`}
        onCancel={() => setMoving(null)} onOk={doMove}
        confirmLoading={actionLoading} okText="Move"
      >
        <Form form={moveForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="stage" label="To" rules={[{ required: true, message: "Pick a stage" }]}>
            <Select
              options={[...STAGES, "rejected", "withdrawn"]
                .filter((s) => s !== moving?.stage)
                .map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
            />
          </Form.Item>
          <Form.Item
            name="note" label="Note"
            extra="Worth filling in even for a rejection — six months later this is the only record of why."
          >
            <TextArea rows={3} />
          </Form.Item>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="rating" label="Rating (1-5)" style={{ width: 150 }}>
              <InputNumber min={1} max={5} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="scheduledFor" label="Scheduled for" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ── History ── */}
      <Drawer
        width={520} open={!!openCandidate} onClose={() => setOpenCandidate(null)}
        title={openCandidate?.candidateName}
      >
        {openCandidate && (
          <>
            <div style={{ ...sectionPanel, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <div>{openCandidate.email}{openCandidate.phone ? ` · ${openCandidate.phone}` : ""}</div>
                {openCandidate.qualification && <div>{openCandidate.qualification}</div>}
                {openCandidate.currentEmployer && <div>Currently at {openCandidate.currentEmployer}</div>}
                {openCandidate.expectedSalary != null && <div>Expecting ₹{openCandidate.expectedSalary.toLocaleString("en-IN")}</div>}
              </div>
            </div>

            <Steps
              size="small"
              direction="vertical"
              current={STAGES.indexOf(openCandidate.stage)}
              status={TERMINAL.includes(openCandidate.stage) && openCandidate.stage !== "hired" ? "error" : "process"}
              items={STAGES.map((s) => ({ title: STAGE_LABEL[s] }))}
              style={{ marginBottom: 20 }}
            />

            <div style={{ fontWeight: 700, marginBottom: 10 }}>What happened</div>
            <Timeline
              items={(openCandidate.history || []).map((h) => ({
                color: STAGE_COLOR[h.stage] === "var(--danger)" ? "red" : "blue",
                children: (
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {STAGE_LABEL[h.stage]}
                      {h.rating ? <Tag style={{ marginLeft: 8 }}>{h.rating}/5</Tag> : null}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {dayjs(h.at).format("D MMM YYYY, h:mm A")}
                      {h.scheduledFor ? ` · scheduled ${dayjs(h.scheduledFor).format("D MMM, h:mm A")}` : ""}
                    </div>
                    {h.note && <div style={{ fontSize: 13, marginTop: 4 }}>{h.note}</div>}
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default RecruitmentPage;

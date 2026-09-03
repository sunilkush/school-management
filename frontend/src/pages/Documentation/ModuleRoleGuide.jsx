import React, { useMemo, useState } from "react";
import { Alert, Empty, Input, Segmented, Tag, Tooltip } from "antd";
import {
  ApartmentOutlined, BankOutlined, CalendarOutlined, CarOutlined,
  IdcardOutlined, InfoCircleOutlined, ReadOutlined,
  SafetyOutlined, SearchOutlined, SolutionOutlined, UsbOutlined,
  VideoCameraOutlined, WarningOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, iconWell, pageWrapper, pill, sectionPanel } from "../../styles/pageStyles";

/**
 * Which role uses which module, and how.
 *
 * The role lists below are transcribed from the roleMiddleware arrays in the backend route files,
 * not from what the modules were meant to allow — a guide that disagrees with the server is worse
 * than none, because somebody plans around it and then hits a 403.
 *
 * "Limits" are stated where a module deliberately does less than its name suggests. Those are the
 * lines that stop a school buying it expecting something it will not get.
 */

const MANAGE = "Set up & change";
const USE = "Day-to-day use";
const READ = "View only";

const LEVEL_COLOR = {
  [MANAGE]: "var(--primary)",
  [USE]: "var(--success)",
  [READ]: "var(--text-secondary)",
};

const MODULES = [
  /* ── Admissions ─────────────────────────────────────────── */
  {
    id: "admissions",
    group: "Admissions",
    icon: <SolutionOutlined />,
    color: "var(--primary)",
    title: "Online Admission Portal",
    subtitle: "Public application form, and the office queue behind it",
    what: "A parent applies from the public website with no login, gets an application number, and can track the status. The office works through the applications and converts an accepted one into a student.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Principal", "Vice Principal", "Receptionist", "Counselor"], can: "Review applications, change status, request documents, convert to a student" },
      { level: READ, roles: ["Super Admin", "School Admin", "Principal", "Vice Principal"], can: "Admission statistics and conversion figures" },
    ],
    flow: [
      "Turn admissions on for the school so the public form accepts applications.",
      "A parent applies on the public page — no account needed.",
      "Reception works the queue: shortlist, request missing documents, accept or decline.",
      "An accepted application is converted into a student record and a parent login.",
    ],
    where: [{ role: "School Admin", path: "School Admin → Admission → Inquiries" }],
    limits: ["Tracking needs the application number and the registered phone together, so applicants cannot be listed by guessing numbers."],
  },

  /* ── Academics ──────────────────────────────────────────── */
  {
    id: "report-cards",
    group: "Academics",
    icon: <ReadOutlined />,
    color: "var(--purple)",
    title: "Report Cards",
    subtitle: "Templates, weighted marks, printable cards",
    what: "Builds a consolidated report card from exam results already in the system, using a template that decides which exams count and how much each is worth.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator"], can: "Create templates, set weights, publish cards" },
      { level: USE, roles: ["Teacher", "Class Teacher", "Subject Coordinator"], can: "Generate and print cards for their classes" },
      { level: READ, roles: ["Student"], can: "Their own cards" },
      { level: READ, roles: ["Parent"], can: "Their own child's cards" },
    ],
    flow: [
      "Create a template for the class: which exams count, and the weight of each.",
      "Make sure marks are entered for those exams.",
      "Generate the cards — the weighted total and grade are worked out for you.",
      "Print, or publish so parents and students can see them.",
    ],
    where: [{ role: "School Admin", path: "School Admin → Exams → Report Cards" }],
  },
  {
    id: "timetable",
    group: "Academics",
    icon: <CalendarOutlined />,
    color: "var(--cyan)",
    title: "Timetable & Substitutions",
    subtitle: "Build the week, and cover a teacher who is away",
    what: "The weekly timetable, generated or built by hand, plus same-day substitution: when a teacher is out, find who is genuinely free and assign the cover.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Principal", "Vice Principal"], can: "Build and generate the timetable, manage rooms and time slots" },
      { level: USE, roles: ["Exam Coordinator", "Subject Coordinator"], can: "Arrange substitutions" },
      { level: READ, roles: ["Teacher", "Class Teacher", "Sports Teacher"], can: "Their own timetable and the covers assigned to them" },
      { level: READ, roles: ["Student", "Parent"], can: "The class timetable" },
    ],
    flow: [
      "Set up time slots and rooms once.",
      "Generate the timetable, then adjust anything the generator could not place.",
      "When a teacher is absent, open Substitutions for that date and pick a free teacher.",
      "The cover shows on the substitute's own timetable for that day only.",
    ],
    where: [{ role: "School Admin", path: "School Admin → Timetable → Substitutions" }],
    limits: ["A substitution is an overlay on one date. It never edits the underlying timetable, so next week is unaffected."],
  },
  {
    id: "online-classes",
    group: "Academics",
    icon: <VideoCameraOutlined />,
    color: "var(--accent)",
    title: "Online Classes",
    subtitle: "Schedule a live class and see who joined",
    what: "Schedules a live class against a class and section, shows the meeting link at the right time, and logs who opened it.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Principal", "Vice Principal", "Teacher", "Class Teacher", "Subject Coordinator", "Exam Coordinator"], can: "Schedule, cancel, see the join log, mark the register from it" },
      { level: USE, roles: ["Student", "Parent"], can: "See upcoming classes and join when the link opens" },
    ],
    flow: [
      "Create the meeting in your own Meet / Zoom / Teams account and copy the link.",
      "Schedule the class here: pick the class and section, the time, and paste the link.",
      "Students see the class straight away, but the link only appears shortly before it starts.",
      "Afterwards, open the join log and mark the register from it if you agree with the list.",
      "Paste the recording link so anyone who missed it can catch up.",
    ],
    where: [
      { role: "Teacher", path: "Teacher → Online Classes" },
      { role: "Student / Parent", path: "Online Classes" },
    ],
    limits: [
      "It does not host the video. Use the meeting tool the school already has — nothing to buy or set up.",
      "The join log records who opened the link, not who sat through the lesson. Attendance is never marked from it automatically; a teacher does it after looking at the list.",
    ],
  },

  /* ── Attendance ─────────────────────────────────────────── */
  {
    id: "attendance-devices",
    group: "Attendance",
    icon: <UsbOutlined />,
    color: "var(--warning)",
    title: "Biometric & RFID Devices",
    subtitle: "Fingerprint terminals and card readers",
    what: "Registers an attendance reader, records which card or finger belongs to whom, and turns the scans into attendance.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin"], can: "Register devices, enrol and revoke cards, reprocess unknown scans" },
      { level: READ, roles: ["Principal", "Vice Principal", "Receptionist"], can: "See devices, the scan log and the daily summary" },
    ],
    flow: [
      "Register the reader here and copy the device key and secret — the secret is shown once only.",
      "Enter those in whatever sends the scans: the vendor's software, or a script on the school network.",
      "Enrol each card or fingerprint against the right person.",
      "Scans become attendance on their own. Anything from an unknown card is listed so you can enrol it and reprocess.",
    ],
    where: [{ role: "School Admin", path: "School Admin → Attendance → Biometric / RFID" }],
    limits: [
      "Works with any device that can post a signed batch — it is not tied to one brand.",
      "A reader that stops reporting is flagged, because otherwise everyone it covers silently shows as absent.",
    ],
  },

  /* ── Finance ────────────────────────────────────────────── */
  {
    id: "ledger",
    group: "Finance",
    icon: <BankOutlined />,
    color: "var(--success)",
    title: "Accounting (Double Entry)",
    subtitle: "Chart of accounts, journal, statements, reconciliation",
    what: "Proper books behind the money the system already records. Fee payments, refunds, salaries, income and expenses become journal entries, and the statements are built from them.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Accountant"], can: "Set up accounts, post and reverse entries, run the posting sweep" },
      { level: READ, roles: ["Principal", "Vice Principal"], can: "Trial balance, income & expenditure, balance sheet" },
    ],
    flow: [
      "Set up the default chart of accounts once — it is already shaped for an Indian school.",
      "Open Reconciliation and run Post pending. Everything already recorded becomes journal entries.",
      "Add any entry the system cannot know about (opening balances, adjustments) by hand in the Journal.",
      "Read the statements. Check Reconciliation first — it answers whether they can be trusted right now.",
    ],
    where: [
      { role: "Accountant", path: "Accountant → Accounting" },
      { role: "Principal", path: "Principal → Financial Statements" },
    ],
    limits: [
      "A posted entry can never be edited — only reversed with a matching entry, so the trail stays intact.",
      "Statements count posted entries only. Drafts are excluded, so two people cannot quote different numbers.",
    ],
  },

  /* ── Transport ──────────────────────────────────────────── */
  {
    id: "bus-tracking",
    group: "Transport",
    icon: <CarOutlined />,
    color: "var(--cyan)",
    title: "Live Bus Tracking",
    subtitle: "Where the bus is, and when it reaches a stop",
    what: "The driver starts their run and the bus appears on a map for the office and for parents, with an estimated arrival at the child's stop.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Transport Manager"], can: "Put stops on the map, start or end any trip, watch every bus" },
      { level: USE, roles: ["Driver"], can: "Start their own run, send the bus position, end the run" },
      { level: READ, roles: ["Principal", "Vice Principal", "Accountant"], can: "Watch the live map" },
      { level: READ, roles: ["Parent", "Student"], can: "Only their own bus, with an estimated arrival" },
    ],
    flow: [
      "Put each route's stops on the map — click the map to place them.",
      "Link each driver's account to their vehicle.",
      "The driver opens My Trip and starts the run at the beginning of the route.",
      "The office watches the live map; parents see their own bus and roughly when it arrives.",
      "The driver ends the trip when the run is over.",
    ],
    where: [
      { role: "Driver", path: "Driver → My Trip" },
      { role: "Transport Manager", path: "Transport Manager → Live Tracking" },
      { role: "Parent", path: "Parent → Where is the Bus" },
    ],
    limits: [
      "The position comes from the driver's phone with the page open — no tracker hardware to buy, but tracking stops if the browser is closed.",
      "Arrival times are estimates from distance and speed, not a road route. They are shown as \"about\".",
      "A route with no stops on the map still shows the bus moving, but nobody gets a \"reached your stop\" update.",
    ],
  },

  /* ── Compliance ─────────────────────────────────────────── */
  {
    id: "compliance",
    group: "Compliance",
    icon: <SafetyOutlined />,
    color: "var(--danger)",
    title: "Government Compliance",
    subtitle: "UDISE+, PEN, APAAR and RTE records",
    what: "Holds the government identifiers for the school and every child, and shows exactly which records are not yet complete enough to file.",
    access: [
      { level: MANAGE, roles: ["Super Admin", "School Admin", "Receptionist"], can: "Edit school and student identifiers, record APAAR consent, bulk update" },
      { level: READ, roles: ["Principal", "Vice Principal"], can: "Readiness and the RTE position" },
    ],
    flow: [
      "Enter the school's UDISE code and board details once.",
      "Open Readiness — it lists what is missing, grouped by field rather than by child.",
      "Fill the gaps. Use \"set for all listed\" for something a whole class shares, like mother tongue.",
      "Record each parent's APAAR consent before entering an APAAR ID.",
      "Download the sheet and use it when filing on the government portal.",
    ],
    where: [{ role: "School Admin", path: "School Admin → Govt. Compliance" }],
    limits: [
      "Nothing is filed with the government from here — UDISE+ has no interface for a school ERP to submit through. The return is filed on the portal; this makes the data ready for it.",
      "Full Aadhaar numbers are deliberately not stored — only the last four digits and whether the document is on file.",
      "An APAAR ID cannot be saved until the parent's consent is recorded, because it cannot be created without one.",
    ],
  },
];

const GROUPS = ["All", ...Array.from(new Set(MODULES.map((m) => m.group)))];

const ModuleRoleGuide = () => {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return MODULES.filter((m) => {
      if (group !== "All" && m.group !== group) return false;
      if (!kw) return true;
      const haystack = [
        m.title, m.subtitle, m.what,
        ...m.access.flatMap((a) => [a.can, ...a.roles]),
      ].join(" ").toLowerCase();
      return haystack.includes(kw);
    });
  }, [search, group]);

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Modules & Roles"
        subtitle="What each module does, who can use it, and how"
        icon={<ApartmentOutlined />}
        extra={
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search a module or a role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
        }
      />

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16, borderRadius: 14 }}
        message="The role lists here are the ones the server actually enforces"
        description="They are taken from the permission checks in the code, not from what a module was meant to allow — so if a role is not listed for something, that action will be refused."
      />

      <div style={{ marginBottom: 18, overflowX: "auto" }}>
        <Segmented value={group} onChange={setGroup} options={GROUPS} />
      </div>

      {!filtered.length ? (
        <div style={emptyState}>
          <Empty description="Nothing matches that search" />
        </div>
      ) : (
        filtered.map((module) => (
          <div key={module.id} style={sectionPanel}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={iconWell(module.color, 44)}>{module.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{module.title}</span>
                  <Tag>{module.group}</Tag>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{module.subtitle}</div>
              </div>
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-primary)", marginTop: 0 }}>
              {module.what}
            </p>

            {/* ── Who can do what ── */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
                Who can use it
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {module.access.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <span style={{ ...pill(LEVEL_COLOR[row.level]), whiteSpace: "nowrap", flexShrink: 0 }}>
                      {row.level}
                    </span>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        {row.roles.map((r) => (
                          <Tag key={r} style={{ marginInlineEnd: 0 }}>{r}</Tag>
                        ))}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.can}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── How it is used ── */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
                How it is used
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {module.flow.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <div style={{ ...iconWell(module.color, 22), borderRadius: 7, fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Where to find it ── */}
            {module.where?.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>Where:</span>
                {module.where.map((w) => (
                  <Tooltip key={w.path} title={`As ${w.role}`}>
                    <span style={{ ...pill("var(--text-secondary)"), fontFamily: "inherit" }}>{w.path}</span>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* ── What it deliberately does not do ── */}
            {module.limits?.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--warning) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--warning)", marginBottom: 6 }}>
                  <WarningOutlined /> Worth knowing before you rely on it
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                  {module.limits.map((limit, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>{limit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}

      <div style={{ ...sectionPanel, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={iconWell("var(--primary)", 36)}><IdcardOutlined /></div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--text-secondary)" }}>
          Looking for step-by-step instructions for your own job rather than the whole system?
          Open <b>Documentation</b> from the sidebar — it shows the guide for the role you are
          signed in as.
        </div>
      </div>
    </div>
  );
};

export default ModuleRoleGuide;

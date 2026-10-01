import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Empty, List, Modal, Spin, Tag, message } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";

const EVENT_TYPE_COLOR = {
  Holiday:  "red",
  Exam:     "blue",
  Meeting:  "cyan",
  Activity: "green",
  Reminder: "orange",
  Event:    "purple",
};

// antd tag colour names → the dot shown under a date.
const DOT_COLOR = { red: "var(--danger)", blue: "var(--primary)", cyan: "var(--cyan)", green: "var(--success)", orange: "var(--warning)", purple: "var(--purple)" };

const AcademicCalendar = () => {
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/events", { params: { limit: 200 } });
        const data = res.data?.data?.events || res.data?.data || [];
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        message.error(err?.response?.data?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = dayjs(ev.startDate || ev.date).format("YYYY-MM-DD");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const stats = useMemo(() => {
    const now = dayjs();
    return {
      total:    events.length,
      upcoming: events.filter((e) => dayjs(e.startDate || e.date).isAfter(now)).length,
      holidays: events.filter((e) => e.type === "Holiday").length,
      exams:    events.filter((e) => e.type === "Exam").length,
    };
  }, [events]);

  const upcoming = useMemo(
    () => events
      .filter((e) => dayjs(e.startDate || e.date).isAfter(dayjs().subtract(1, "day")))
      .sort((a, b) => dayjs(a.startDate || a.date).diff(dayjs(b.startDate || b.date)))
      .slice(0, 12),
    [events]
  );

  // One dot per event (three at most) under the date.
  const dateCellRender = (value) => {
    const list = eventsByDate[value.format("YYYY-MM-DD")] || [];
    if (!list.length) return null;
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: 2, height: 5 }}>
        {list.slice(0, 3).map((ev) => (
          <span key={ev._id} style={{ width: 5, height: 5, borderRadius: "50%", background: DOT_COLOR[EVENT_TYPE_COLOR[ev.type]] || "var(--text-muted)" }} />
        ))}
      </div>
    );
  };

  const handleSelectDay = (value, info) => {
    // Changing month or year also "selects" a date; only a click on a day opens its events.
    if (info && info.source !== "date") return;
    const key = value.format("YYYY-MM-DD");
    const list = eventsByDate[key] || [];
    if (list.length) {
      setSelected(value);
      setDayEvents(list);
      setModalOpen(true);
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Academic Calendar"
        subtitle="View school events, holidays, and exam schedules"
        icon={<CalendarOutlined />}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
        {[
          ["Total", stats.total, "var(--accent)"],
          ["Upcoming", stats.upcoming, "var(--cyan)"],
          ["Holidays", stats.holidays, "var(--danger)"],
          ["Exams", stats.exams, "var(--success)"],
        ].map(([label, value, color]) => (
          <span key={label} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: "var(--surface)", border: "1px solid var(--border-muted)", borderLeft: `3px solid ${color}` }}>
            {label} <b style={{ fontSize: 14, marginLeft: 4 }}>{value}</b>
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, alignItems: "start" }}>
        <div className="section-panel" style={{ margin: 0, padding: "8px 12px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin /></div>
          ) : (
            <Calendar fullscreen={false} cellRender={dateCellRender} onSelect={handleSelectDay} style={{ background: "transparent" }} />
          )}
          <div className="u-meta" style={{ padding: "2px 4px 4px" }}>A dot marks a day with events. Click the day to see them.</div>
        </div>

        <div className="section-panel" style={{ margin: 0, padding: "12px 14px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>Upcoming Events</div>
          {upcoming.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No upcoming events" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {upcoming.map((ev) => (
                <div key={ev._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 10, border: "1px solid var(--border-muted)" }}>
                  <div style={{ flexShrink: 0, width: 40, textAlign: "center", background: "var(--primary)", color: "#fff", borderRadius: 8, padding: "4px 2px" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{dayjs(ev.startDate || ev.date).format("DD")}</div>
                    <div style={{ fontSize: 9, fontWeight: 600 }}>{dayjs(ev.startDate || ev.date).format("MMM")}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                    {ev.description && (
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ev.description}>{ev.description}</div>
                    )}
                  </div>
                  <Tag color={EVENT_TYPE_COLOR[ev.type] || "default"} style={{ fontSize: 11, margin: 0 }}>{ev.type || "Event"}</Tag>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day events modal */}
      <Modal
        title={selected ? `Events on ${selected.format("DD MMMM YYYY")}` : "Events"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <List
          dataSource={dayEvents}
          locale={{ emptyText: "No events" }}
          renderItem={(ev) => (
            <List.Item>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{ev.title}</div>
                <Tag color={EVENT_TYPE_COLOR[ev.type] || "default"}>{ev.type || "Event"}</Tag>
                {ev.description && (
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{ev.description}</div>
                )}
              </div>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default AcademicCalendar;

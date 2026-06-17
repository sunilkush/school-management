import React, { useEffect, useMemo, useState } from "react";
import { Badge, Calendar, Empty, List, Modal, Spin, Tag, message } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../api/httpClient";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, statGrid, iconWell } from "../../../styles/pageStyles";

const EVENT_TYPE_COLOR = {
  holiday:     "red",
  exam:        "blue",
  sports:      "green",
  cultural:    "purple",
  ptm:         "orange",
  meeting:     "cyan",
  other:       "default",
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", marginBottom: 0 }}>
    <div style={iconWell(color, 42)}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
    </div>
  </div>
);

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
      holidays: events.filter((e) => e.eventType === "holiday").length,
      exams:    events.filter((e) => e.eventType === "exam").length,
    };
  }, [events]);

  const dateCellRender = (value) => {
    const key  = value.format("YYYY-MM-DD");
    const list = eventsByDate[key] || [];
    if (!list.length) return null;
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {list.slice(0, 2).map((ev) => (
          <li key={ev._id} style={{ marginBottom: 2 }}>
            <Badge
              color={EVENT_TYPE_COLOR[ev.eventType] === "default" ? "#666" : EVENT_TYPE_COLOR[ev.eventType]}
              text={<span style={{ fontSize: 11, color: "var(--text-primary)" }}>{ev.title}</span>}
            />
          </li>
        ))}
        {list.length > 2 && (
          <li style={{ fontSize: 11, color: "var(--primary)" }}>+{list.length - 2} more</li>
        )}
      </ul>
    );
  };

  const handleSelectDay = (value) => {
    const key = value.format("YYYY-MM-DD");
    const list = eventsByDate[key] || [];
    if (list.length) {
      setSelected(value);
      setDayEvents(list);
      setModalOpen(true);
    }
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Academic Calendar"
        subtitle="View school events, holidays, and exam schedules"
        icon={<CalendarOutlined />}
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        <StatCard icon={<CalendarOutlined />} label="Total Events" value={stats.total}    color="#7c3aed" />
        <StatCard icon={<CalendarOutlined />} label="Upcoming"     value={stats.upcoming} color="#0891b2" />
        <StatCard icon={<CalendarOutlined />} label="Holidays"     value={stats.holidays} color="#dc2626" />
        <StatCard icon={<CalendarOutlined />} label="Exams"        value={stats.exams}    color="#059669" />
      </div>

      <div style={{ ...sectionPanel, marginTop: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Calendar
            cellRender={dateCellRender}
            onSelect={handleSelectDay}
            style={{ background: "transparent" }}
          />
        )}
      </div>

      {/* Upcoming events list */}
      <div style={{ ...sectionPanel, marginTop: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
          Upcoming Events
        </div>
        {events
          .filter((e) => dayjs(e.startDate || e.date).isAfter(dayjs().subtract(1, "day")))
          .sort((a, b) => dayjs(a.startDate || a.date).diff(dayjs(b.startDate || b.date)))
          .slice(0, 10)
          .length === 0 ? (
          <Empty description="No upcoming events" />
        ) : (
          <List
            dataSource={events
              .filter((e) => dayjs(e.startDate || e.date).isAfter(dayjs().subtract(1, "day")))
              .sort((a, b) => dayjs(a.startDate || a.date).diff(dayjs(b.startDate || b.date)))
              .slice(0, 10)}
            renderItem={(ev) => (
              <List.Item>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, width: "100%" }}>
                  <div style={{
                    flexShrink: 0, width: 50, textAlign: "center",
                    background: "var(--primary)", color: "#fff",
                    borderRadius: 10, padding: "6px 4px",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                      {dayjs(ev.startDate || ev.date).format("DD")}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>
                      {dayjs(ev.startDate || ev.date).format("MMM")}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{ev.title}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Tag color={EVENT_TYPE_COLOR[ev.eventType] || "default"} style={{ fontSize: 11 }}>
                        {ev.eventType || "event"}
                      </Tag>
                      {ev.description && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{ev.description}</span>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
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
                <Tag color={EVENT_TYPE_COLOR[ev.eventType] || "default"}>{ev.eventType || "event"}</Tag>
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

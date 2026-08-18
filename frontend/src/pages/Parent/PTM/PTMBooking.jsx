import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, Empty, Flex, Popconfirm, Row, Select, Space, Tag, Typography, message,
} from "antd";
import { CalendarOutlined, EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { getAvailableSlots, bookSlot, cancelBooking, getMyBookings } from "../../../features/ptmSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel } from "../../../styles/pageStyles.js";

const { Text } = Typography;

const fmtTime = (v) => (v ? dayjs(v).format("hh:mm A") : "—");
const fmtDate = (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—");

export default function PTMBooking() {
  const dispatch = useDispatch();

  const { children = [], loading: childrenLoading } = useSelector((s) => s.studentPortal || {});
  const { availableSlots = [], myBookings = [] } = useSelector((s) => s.ptm || {});

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [bookingSlotId, setBookingSlotId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);
  useEffect(() => { dispatch(getMyBookings()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0]?._id);
  }, [children, selectedChildId]);

  const selectedChild = useMemo(() => children.find((c) => c._id === selectedChildId) || null, [children, selectedChildId]);

  useEffect(() => {
    if (selectedChild?.classId && selectedChild?.sectionId) {
      dispatch(getAvailableSlots({ schoolClassId: selectedChild.classId, sectionId: selectedChild.sectionId }));
    }
  }, [selectedChild, dispatch]);

  const groupedBySession = useMemo(() => {
    const groups = new Map();
    availableSlots.forEach((slot) => {
      const key = slot.session?._id || "unknown";
      if (!groups.has(key)) groups.set(key, { session: slot.session, slots: [] });
      groups.get(key).slots.push(slot);
    });
    return [...groups.values()];
  }, [availableSlots]);

  const handleBook = async (slotId) => {
    if (!selectedChild) return message.warning("Please select a child first.");
    setBookingSlotId(slotId);
    const res = await dispatch(bookSlot({ id: slotId, studentId: selectedChild._id }));
    setBookingSlotId(null);
    if (bookSlot.fulfilled.match(res)) {
      message.success("Slot booked successfully");
      dispatch(getMyBookings());
    } else {
      message.error(res.payload || "This slot is no longer available");
      if (selectedChild?.classId && selectedChild?.sectionId) {
        dispatch(getAvailableSlots({ schoolClassId: selectedChild.classId, sectionId: selectedChild.sectionId }));
      }
    }
  };

  const handleCancel = async (slotId) => {
    const res = await dispatch(cancelBooking({ id: slotId }));
    if (cancelBooking.fulfilled.match(res)) {
      message.success("Booking cancelled");
      if (selectedChild?.classId && selectedChild?.sectionId) {
        dispatch(getAvailableSlots({ schoolClassId: selectedChild.classId, sectionId: selectedChild.sectionId }));
      }
    } else {
      message.error(res.payload || "Failed to cancel booking");
    }
  };

  return (
    <>
      <PageHeader
        title="Parent-Teacher Meetings"
        subtitle="Book a slot to meet your child's teacher"
        icon={<CalendarOutlined />}
      />

      <div style={pageWrapper}>
        {/* ── Child picker ─────────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
            <div style={iconWell("var(--primary)", 38)}><UserOutlined style={{ fontSize: 17 }} /></div>
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Select Child</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Available PTM slots are shown for your child's class</Text>
            </div>
          </Flex>
          <Select
            placeholder="Select Child" style={{ width: "100%", maxWidth: 360 }}
            value={selectedChildId} onChange={setSelectedChildId} loading={childrenLoading} size="large"
            options={children.map((c) => ({ value: c._id, label: `${c.name} (${c.className || "—"} - ${c.sectionName || "—"})` }))}
          />
        </div>

        {/* ── Available slots ──────────────────────────────────── */}
        <div style={{ ...sectionPanel, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14, marginBottom: 14, display: "block" }}>Available Slots</Text>
          {!selectedChild ? (
            <Alert type="info" showIcon message="Select a child to see available PTM slots." style={{ borderRadius: 10 }} />
          ) : groupedBySession.length === 0 ? (
            <Empty description="No PTM slots available right now" style={{ padding: "30px 0" }} />
          ) : (
            groupedBySession.map(({ session, slots }) => (
              <div key={session?._id || Math.random()} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px dashed var(--border-muted)" }}>
                <Flex align="center" gap={10} wrap="wrap" style={{ marginBottom: 10 }}>
                  <Text strong style={{ fontSize: 14 }}>{session?.title || "PTM Session"}</Text>
                  <Tag>{fmtDate(session?.date)}</Tag>
                  {session?.teacherId?.name && <Tag color="blue">{session.teacherId.name}</Tag>}
                  {session?.location && <Tag icon={<EnvironmentOutlined />}>{session.location}</Tag>}
                </Flex>
                <Row gutter={[8, 8]}>
                  {slots.map((slot) => (
                    <Col key={slot._id}>
                      <Button
                        loading={bookingSlotId === slot._id}
                        onClick={() => handleBook(slot._id)}
                      >
                        {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </div>

        {/* ── My bookings ──────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Text strong style={{ fontSize: 14, marginBottom: 14, display: "block" }}>My Bookings</Text>
          {myBookings.filter((b) => b.status === "Booked").length === 0 ? (
            <Empty description="No upcoming PTM bookings" style={{ padding: "30px 0" }} />
          ) : (
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
              {myBookings.filter((b) => b.status === "Booked").map((b) => (
                <Flex key={b._id} align="center" justify="space-between" style={{ border: "1px solid var(--border-muted)", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <Text strong>{b.ptmSessionId?.title || "PTM Session"}</Text>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {fmtDate(b.ptmSessionId?.date)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                      {b.ptmSessionId?.teacherId?.name && ` · ${b.ptmSessionId.teacherId.name}`}
                    </div>
                  </div>
                  <Popconfirm title="Cancel this booking?" onConfirm={() => handleCancel(b._id)}>
                    <Button size="small" danger>Cancel</Button>
                  </Popconfirm>
                </Flex>
              ))}
            </Space>
          )}
        </div>
      </div>
    </>
  );
}

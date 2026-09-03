import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Empty, Select, Spin, Tag } from "antd";
import { ClockCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import { fetchMyBus } from "../../../features/busTrackingSlice";
import BusMap from "../../../components/transport/BusMap";
import PageHeader from "../../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel } from "../../../styles/pageStyles";

/**
 * "Where is my child's bus" — the one screen a parent actually opens, on a phone, in the morning.
 *
 * It refreshes itself rather than making the parent pull to reload, and it is explicit about the
 * ETA being an estimate. A parent who trusts "4 minutes" to the minute and misses the bus is
 * worse off than one who was told "about 4 minutes".
 */

const REFRESH_MS = 15000;

const ChildBusLive = () => {
  const dispatch = useDispatch();
  const { children = [] } = useSelector((s) => s.studentPortal || {});
  const { myBus, myBusLoading } = useSelector((s) => s.busTracking || {});
  const role = useSelector((s) => s.auth?.user?.role?.name || "");

  const isStudent = role.toLowerCase().trim() === "student";
  const [childId, setChildId] = useState(null);

  useEffect(() => {
    if (!isStudent) dispatch(fetchMyChildren());
  }, [dispatch, isStudent]);

  useEffect(() => {
    if (!isStudent && !childId && children.length) setChildId(children[0].userId);
  }, [children, childId, isStudent]);

  useEffect(() => {
    if (!isStudent && !childId) return undefined;
    const load = () => dispatch(fetchMyBus(isStudent ? {} : { childId }));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [dispatch, childId, isStudent]);

  const stops = useMemo(() => myBus?.stopArrivals || [], [myBus]);

  const body = () => {
    if (myBusLoading && !myBus) return <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>;
    if (!myBus) return null;

    if (!myBus.assigned) {
      return (
        <div style={emptyState}>
          <Empty description="This student does not use school transport" />
        </div>
      );
    }

    if (!myBus.running) {
      return (
        <div style={emptyState}>
          <Empty description="The bus is not running right now" />
          <p style={{ color: "var(--text-muted)", marginTop: 12, maxWidth: 420, marginInline: "auto" }}>
            {myBus.routeName ? `${myBus.routeName} — ` : ""}
            this page will show the bus as soon as the driver starts the run. Nothing is shown in
            the meantime on purpose: an old position would send you to the stop too early.
          </p>
        </div>
      );
    }

    return (
      <>
        <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{myBus.routeName || "Bus"}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {myBus.direction === "pickup" ? "Morning pickup" : "Afternoon drop"}
              {myBus.stopName ? ` · your stop: ${myBus.stopName}` : ""}
            </div>
          </div>

          {myBus.eta?.available ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>
                <ClockCircleOutlined /> ~{myBus.eta.minutes} min
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {myBus.eta.stopsAway} stop(s) away · estimate, not an exact time
              </div>
            </div>
          ) : (
            <Tag color={myBus.eta?.arrivedAt ? "green" : "orange"} style={{ fontSize: 13, padding: "4px 12px" }}>
              {myBus.eta?.arrivedAt
                ? `Reached your stop at ${new Date(myBus.eta.arrivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                : myBus.eta?.reason || "No arrival time available"}
            </Tag>
          )}
        </div>

        {!myBus.lastLocation && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16, borderRadius: 14 }}
            message="The bus has started but is not sending its position"
            description="The driver's phone has not shared location yet. The school can see this too."
          />
        )}

        <div style={sectionPanel}>
          <BusMap
            stops={myBus.stops || []}
            bus={myBus.lastLocation}
            arrivedSequences={stops.map((s) => s.sequence)}
            height={420}
          />
          {stops.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stops.map((s) => (
                <span key={s.sequence} style={pill("var(--success)")}>
                  {s.name} · {new Date(s.arrivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Where is the Bus"
        subtitle="Updates on its own every few seconds"
        icon={<EnvironmentOutlined />}
        extra={
          isStudent ? null : (
            <Select
              style={{ minWidth: 200 }}
              placeholder="Select child"
              value={childId}
              onChange={setChildId}
              options={children.map((c) => ({ value: c.userId, label: c.name }))}
            />
          )
        }
      />
      {body()}
    </div>
  );
};

export default ChildBusLive;

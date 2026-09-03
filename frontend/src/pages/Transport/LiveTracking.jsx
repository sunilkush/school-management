import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Empty, Spin, Switch, Table, Tag, Tooltip } from "antd";
import { EnvironmentOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { fetchLiveTrips, fetchTripTrail, clearTrail } from "../../features/busTrackingSlice";
import BusMap from "../../components/transport/BusMap";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel, tableContainer, tableHeadCss } from "../../styles/pageStyles";

/** How often the office view re-reads positions. Ten seconds is about as fast as the data itself
 *  changes; anything quicker is load with nothing new to show. */
const REFRESH_MS = 10000;

const minutesAgo = (iso) => Math.round((Date.now() - new Date(iso).getTime()) / 60000);

const LiveTracking = () => {
  const dispatch = useDispatch();
  const { liveTrips, liveLoading, trail, trailLoading } = useSelector((s) => s.busTracking || {});

  const [selectedId, setSelectedId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    dispatch(fetchLiveTrips());
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => {
      dispatch(fetchLiveTrips());
      if (selectedId) dispatch(fetchTripTrail(selectedId));
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [dispatch, autoRefresh, selectedId]);

  useEffect(() => {
    if (selectedId) dispatch(fetchTripTrail(selectedId));
    else dispatch(clearTrail());
  }, [dispatch, selectedId]);

  // Pick a bus automatically so the page is never an empty map next to a populated list.
  useEffect(() => {
    if (!selectedId && liveTrips?.length) setSelectedId(liveTrips[0].tripId);
  }, [liveTrips, selectedId]);

  const silent = useMemo(() => (liveTrips || []).filter((t) => !t.isReporting), [liveTrips]);

  const columns = [
    {
      title: "Route", dataIndex: "routeName",
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name || "Route"}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {r.direction === "pickup" ? "Morning pickup" : "Afternoon drop"}
          </div>
        </div>
      ),
    },
    {
      title: "Last seen", width: 150,
      render: (_, r) =>
        r.lastLocation ? (
          <span style={{ color: minutesAgo(r.lastLocation.recordedAt) > 5 ? "var(--warning)" : "var(--text-primary)" }}>
            {minutesAgo(r.lastLocation.recordedAt) < 1 ? "just now" : `${minutesAgo(r.lastLocation.recordedAt)} min ago`}
          </span>
        ) : (
          <Tooltip title="The trip was started but the driver's device has not sent a position. On a map this looks exactly like a parked bus.">
            <span style={pill("var(--warning)")}><WarningOutlined /> no signal</span>
          </Tooltip>
        ),
    },
    {
      title: "Stops done", width: 120, align: "right",
      render: (_, r) => `${r.stopArrivals?.length || 0} / ${r.stopsTotal || 0}`,
    },
    {
      title: "Speed", width: 100, align: "right",
      render: (_, r) => (r.lastLocation?.speedKph != null ? `${Math.round(r.lastLocation.speedKph)} km/h` : "—"),
    },
  ];

  const selected = (liveTrips || []).find((t) => t.tripId === selectedId);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("live-table")}</style>

      <PageHeader
        title="Live Bus Tracking"
        subtitle="Buses that are on the road right now"
        icon={<EnvironmentOutlined />}
        extra={
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
              Auto refresh
              <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
            </span>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchLiveTrips())} />
          </div>
        }
      />

      {silent.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 14 }}
          message={`${silent.length} bus(es) are marked as running but not sending a position`}
          description="Usually the driver has not allowed location access on their phone. Until they do, those buses cannot be tracked and no stop arrivals will be recorded."
        />
      )}

      {liveLoading && !liveTrips?.length ? (
        <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
      ) : !liveTrips?.length ? (
        <div style={emptyState}>
          <Empty description="No bus is running at the moment" />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
            A trip appears here as soon as a driver starts their run.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: 20, alignItems: "start" }}
             className="live-track-grid">
          <div style={sectionPanel}>
            <div style={tableContainer}>
              <Table
                className="live-table"
                rowKey="tripId"
                size="middle"
                pagination={false}
                columns={columns}
                dataSource={liveTrips}
                rowClassName={(r) => (r.tripId === selectedId ? "live-row-selected" : "")}
                onRow={(r) => ({ onClick: () => setSelectedId(r.tripId), style: { cursor: "pointer" } })}
              />
            </div>
          </div>

          <div style={sectionPanel}>
            {selected && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.routeName || "Route"}</div>
                {!selected.hasMappedStops && (
                  <Tag color="orange">Stops are not on the map — arrivals cannot be detected</Tag>
                )}
              </div>
            )}

            {trailLoading && !trail ? (
              <div style={{ textAlign: "center", padding: 64 }}><Spin /></div>
            ) : (
              <BusMap
                stops={trail?.stops || []}
                trail={trail?.trail || []}
                bus={trail?.trip?.lastLocation || null}
                arrivedSequences={(trail?.trip?.stopArrivals || []).map((s) => s.sequence)}
                height={520}
              />
            )}

            {trail?.trip?.stopArrivals?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Stops reached
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {trail.trip.stopArrivals.map((s) => (
                    <span key={s.sequence} style={pill(s.delayMin > 5 ? "var(--warning)" : "var(--success)")}>
                      {s.name} · {new Date(s.arrivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {s.delayMin != null && s.delayMin > 0 ? ` · ${s.delayMin} min late` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .live-row-selected > td { background: var(--surface-soft) !important; }
        @media (max-width: 1100px) {
          .live-track-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LiveTracking;

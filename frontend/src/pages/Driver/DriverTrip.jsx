import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Empty, Popconfirm, Segmented, Select, Spin, Tag, message } from "antd";
import { AimOutlined, CarOutlined, PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import apiClient from "../../api/httpClient";
import { endTrip, sendPing, setActiveTrip, startTrip } from "../../features/busTrackingSlice";
import BusMap from "../../components/transport/BusMap";
import PageHeader from "../../components/layout/PageHeader";
import { emptyState, pageWrapper, pill, sectionPanel } from "../../styles/pageStyles";

/**
 * The driver's screen — the only place bus positions come from.
 *
 * It uses the browser's own geolocation, so there is no tracker hardware to buy and no device to
 * install. The cost is that tracking only lasts while this page is open on the driver's phone,
 * which the page says plainly rather than letting a school discover it on a rainy morning.
 */

/** Sent at most this often. The server also throttles; doing it here as well saves the request. */
const PING_EVERY_MS = 10000;

const DriverTrip = () => {
  const dispatch = useDispatch();
  const { activeTrip, actionLoading, pingFailures, lastPingAt } = useSelector((s) => s.busTracking || {});

  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState();
  const [routeId, setRouteId] = useState();
  const [direction, setDirection] = useState("pickup");
  const [fix, setFix] = useState(null);
  const [geoError, setGeoError] = useState(null);

  const watchId = useRef(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [v, r, open] = await Promise.all([
          apiClient.get("/transport/vehicles/my"),
          apiClient.get("/transport/routes"),
          // Only this driver's own open trip — the office-wide live view is not theirs to see.
          apiClient.get("/transport/trips/mine"),
        ]);
        if (cancelled) return;
        const mine = v?.data?.data || [];
        setVehicles(mine);
        setRoutes(r?.data?.data || []);
        setVehicleId(mine[0]?._id);

        // Resume a run that is already open — a driver who reloaded the page must not have to
        // start a second trip, which the server would refuse anyway.
        if (open?.data?.data) dispatch(setActiveTrip(open.data.data));
      } catch {
        if (!cancelled) message.error("Could not load your vehicle");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch]);

  const push = useCallback(
    (position) => {
      const { latitude, longitude, speed, heading } = position.coords;
      const next = {
        lat: Number(latitude.toFixed(6)),
        lng: Number(longitude.toFixed(6)),
        // The browser reports metres per second; the API works in km/h.
        speedKph: speed == null || Number.isNaN(speed) ? null : Math.round(speed * 3.6),
        headingDeg: heading == null || Number.isNaN(heading) ? null : Math.round(heading),
      };
      setFix(next);

      const tripId = activeTrip?.tripId;
      if (!tripId) return;
      if (Date.now() - lastSentAt.current < PING_EVERY_MS) return;
      lastSentAt.current = Date.now();
      dispatch(sendPing({ id: tripId, ...next, recordedAt: new Date().toISOString() }));
    },
    [dispatch, activeTrip?.tripId]
  );

  // Watch position for as long as a trip is open. Stopping the watch when it ends matters on a
  // phone — a forgotten GPS watch is the fastest way to flatten a driver's battery.
  useEffect(() => {
    if (!activeTrip?.tripId) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return undefined;
    }

    if (!navigator.geolocation) {
      setGeoError("This device cannot report its location.");
      return undefined;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => { setGeoError(null); push(position); },
      (err) => setGeoError(err.message || "Location is not available"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [activeTrip?.tripId, push]);

  const begin = async () => {
    if (!vehicleId || !routeId) { message.warning("Pick your bus and route first"); return; }
    const res = await dispatch(startTrip({ vehicleId, routeId, direction }));
    if (startTrip.fulfilled.match(res)) message.success("Trip started — keep this screen open");
    else message.error(res.payload || "Could not start the trip");
  };

  const finish = async () => {
    const res = await dispatch(endTrip({ id: activeTrip.tripId }));
    if (endTrip.fulfilled.match(res)) message.success("Trip ended");
    else message.error(res.payload || "Could not end the trip");
  };

  const route = routes.find((r) => String(r._id) === String(activeTrip?.routeId || routeId));

  if (loading) return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Trip"
        subtitle="Start your run so the school and parents can see the bus"
        icon={<CarOutlined />}
      />

      {!vehicles.length ? (
        <div style={emptyState}>
          <Empty description="No bus is assigned to you" />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
            Ask the transport office to link your account to a vehicle.
          </p>
        </div>
      ) : !activeTrip ? (
        <Card style={{ ...sectionPanel, maxWidth: 560 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>BUS</div>
              <Select
                style={{ width: "100%" }}
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicles.map((v) => ({ value: v._id, label: `${v.busNumber} — ${v.route || "no route set"}` }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>ROUTE</div>
              <Select
                style={{ width: "100%" }}
                placeholder="Which route are you running?"
                value={routeId}
                onChange={setRouteId}
                options={routes.map((r) => ({
                  value: r._id,
                  label: `${r.name}${r.stopPoints?.length ? "" : " (stops not on the map)"}`,
                }))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>DIRECTION</div>
              <Segmented
                block
                value={direction}
                onChange={setDirection}
                options={[{ label: "Morning pickup", value: "pickup" }, { label: "Afternoon drop", value: "drop" }]}
              />
            </div>

            <Button type="primary" size="large" icon={<PlayCircleOutlined />} loading={actionLoading} onClick={begin}>
              Start trip
            </Button>

            <Alert
              type="info"
              showIcon
              message="Keep this screen open"
              description="The bus is tracked from this phone. If the screen is closed or the browser is shut, tracking stops until you open it again."
            />
          </div>
        </Card>
      ) : (
        <>
          <div style={{ ...sectionPanel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{route?.name || "Trip running"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {activeTrip.direction === "pickup" ? "Morning pickup" : "Afternoon drop"} ·{" "}
                {lastPingAt ? `last sent ${new Date(lastPingAt).toLocaleTimeString("en-IN")}` : "waiting for the first position"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={pill(geoError ? "var(--danger)" : "var(--success)")}>
                <AimOutlined /> {geoError ? "no location" : "tracking"}
              </span>
              <Popconfirm title="End this trip?" onConfirm={finish} okText="End trip">
                <Button danger icon={<PauseCircleOutlined />} loading={actionLoading}>End trip</Button>
              </Popconfirm>
            </div>
          </div>

          {geoError && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16, borderRadius: 14 }}
              message="Location is off"
              description={`${geoError} Until this is fixed the school sees the bus as running but cannot see where it is.`}
            />
          )}

          {pingFailures > 2 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16, borderRadius: 14 }}
              message="Positions are not reaching the school"
              description="The last few updates failed to send. This is usually a weak network — tracking will catch up on its own once the signal returns."
            />
          )}

          {route && !route.stopPoints?.length && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16, borderRadius: 14 }}
              message="This route's stops are not on the map"
              description="The bus can still be seen moving, but nobody will get an automatic 'reached your stop' update."
            />
          )}

          <div style={sectionPanel}>
            <BusMap
              stops={route?.stopPoints || []}
              bus={fix ? { ...fix, recordedAt: lastPingAt } : activeTrip.lastLocation}
              arrivedSequences={(activeTrip.stopArrivals || []).map((s) => s.sequence)}
              height={440}
            />
            {activeTrip.stopArrivals?.length > 0 && (
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeTrip.stopArrivals.map((s) => (
                  <Tag key={s.sequence} color="green">
                    {s.name} · {new Date(s.arrivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DriverTrip;

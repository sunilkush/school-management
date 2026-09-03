import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Drawer, Empty, Input, InputNumber, Space, Table, Tooltip, message } from "antd";
import { AimOutlined, DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip as MapTooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { pill, sectionPanel } from "../../styles/pageStyles";

/**
 * Puts a route's stops on the map.
 *
 * Until this is done a route has names but no coordinates, so live tracking can show the bus
 * moving but can never say "reached your stop" — which is the part parents care about. The
 * drawer therefore starts from the names the route already has, so mapping a route is clicking
 * a map, not retyping a list.
 */

const dot = (n, active) =>
  L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${active ? "#2563EB" : "#94A3B8"};
      color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;
      align-items:center;justify-content:center;font:700 12px/1 sans-serif">${n}</div>`,
  });

const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const RouteStopMapper = ({ open, route, onClose, onSave, saving }) => {
  const [rows, setRows] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open || !route) return;
    // Prefer stops that are already mapped; otherwise seed from the plain name list so nothing
    // has to be typed twice.
    const mapped = route.stopPoints?.length
      ? route.stopPoints.map((s) => ({ ...s }))
      : (route.stops || []).map((name, i) => ({ name, sequence: i, lat: null, lng: null, radiusMeters: 150, expectedOffsetMin: null }));
    setRows(mapped);
    setActiveIndex(0);
  }, [open, route]);

  const placed = useMemo(() => rows.filter((r) => r.lat != null && r.lng != null), [rows]);

  const patch = (index, changes) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...changes } : r)));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next.map((r, i) => ({ ...r, sequence: i })));
    setActiveIndex(target);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { name: "", sequence: prev.length, lat: null, lng: null, radiusMeters: 150, expectedOffsetMin: null }]);
    setActiveIndex(rows.length);
  };

  const removeRow = (index) =>
    setRows((prev) => prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, sequence: i })));

  const useMyLocation = () => {
    if (!navigator.geolocation) { message.warning("This browser cannot report a location"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => patch(activeIndex, {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
      }),
      () => message.error("Could not read your location")
    );
  };

  const save = () => {
    const named = rows.filter((r) => r.name?.trim());
    const unplaced = named.filter((r) => r.lat == null || r.lng == null);
    if (unplaced.length) {
      // Saving half a route would leave arrival detection working for some children and silently
      // not for others, which is worse than refusing.
      message.error(`Place every stop on the map first — ${unplaced.length} still has no location`);
      return;
    }
    onSave(named.map((r, i) => ({ ...r, sequence: i, name: r.name.trim() })));
  };

  const centre = placed.length ? [placed[0].lat, placed[0].lng] : [26.9124, 75.7873];

  const columns = [
    { title: "#", width: 44, render: (_, __, i) => <b>{i + 1}</b> },
    {
      title: "Stop", render: (_, r, i) => (
        <Input value={r.name} placeholder="Stop name" onChange={(e) => patch(i, { name: e.target.value })} />
      ),
    },
    {
      title: "Placed", width: 110,
      render: (_, r) =>
        r.lat != null ? (
          <span style={pill("var(--success)")}>on map</span>
        ) : (
          <span style={pill("var(--warning)")}>not set</span>
        ),
    },
    {
      title: <Tooltip title="How close the bus must get before it counts as arrived">Radius (m)</Tooltip>,
      width: 110,
      render: (_, r, i) => (
        <InputNumber min={20} max={2000} value={r.radiusMeters} onChange={(v) => patch(i, { radiusMeters: v || 150 })} style={{ width: "100%" }} />
      ),
    },
    {
      title: <Tooltip title="Minutes after the trip starts that the bus is normally here. Used to flag a late bus.">Due (min)</Tooltip>,
      width: 100,
      render: (_, r, i) => (
        <InputNumber min={0} value={r.expectedOffsetMin} onChange={(v) => patch(i, { expectedOffsetMin: v })} style={{ width: "100%" }} />
      ),
    },
    {
      title: "", width: 110,
      render: (_, __, i) => (
        <Space size={0}>
          <Button size="small" type="text" icon={<UpOutlined />} onClick={() => move(i, -1)} disabled={i === 0} />
          <Button size="small" type="text" icon={<DownOutlined />} onClick={() => move(i, 1)} disabled={i === rows.length - 1} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeRow(i)} />
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      width={960}
      open={open}
      onClose={onClose}
      title={`Map stops — ${route?.name || ""}`}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={save}>Save stops</Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Click the map to place the highlighted stop"
        description="Select a row, then click where that stop is. Without coordinates the bus can still be watched moving, but nobody gets an automatic 'reached your stop' update."
      />

      <div style={{ ...sectionPanel, padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <MapContainer center={centre} zoom={13} style={{ height: 320, width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={(lat, lng) => patch(activeIndex, { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })} />
          {placed.length > 1 && (
            <Polyline positions={placed.map((s) => [s.lat, s.lng])} pathOptions={{ color: "#2563EB", weight: 3, dashArray: "6 8" }} />
          )}
          {rows.map((r, i) =>
            r.lat != null ? (
              <Marker
                key={i}
                position={[r.lat, r.lng]}
                icon={dot(i + 1, i === activeIndex)}
                eventHandlers={{ click: () => setActiveIndex(i) }}
              >
                <MapTooltip>{r.name || `Stop ${i + 1}`}</MapTooltip>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Button icon={<PlusOutlined />} onClick={addRow}>Add stop</Button>
        <Button icon={<AimOutlined />} onClick={useMyLocation} disabled={!rows.length}>
          Use my location for the selected stop
        </Button>
      </div>

      {rows.length ? (
        <Table
          rowKey={(_, i) => i}
          size="small"
          pagination={false}
          columns={columns}
          dataSource={rows}
          onRow={(_, i) => ({
            onClick: () => setActiveIndex(i),
            style: { cursor: "pointer", background: i === activeIndex ? "var(--surface-soft)" : undefined },
          })}
        />
      ) : (
        <Empty description="No stops yet" />
      )}
    </Drawer>
  );
};

export default RouteStopMapper;

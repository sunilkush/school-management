import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * The one map setup every map in the portal uses — bus tracking, route stops, the school geofence
 * and attendance check-ins — so they all look alike and the tile source lives in one place.
 *
 * Leaflet on OpenStreetMap: no API key, no billing account, nothing for a school to set up. The
 * trade-off is that it needs an internet connection. The mobile app draws the same Leaflet map
 * inside a WebView (mobile/src/components/map/LeafletMap.jsx) with the same tiles.
 */

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Where a map opens when it has nothing of its own to show yet. */
export const DEFAULT_CENTRE = [26.9124, 75.7873];

/**
 * Concrete colours, not CSS variables: Leaflet writes them into SVG attributes, where var() is not
 * resolved and the shape would silently draw black.
 */
export const MAP_COLORS = {
  primary: "#2563EB",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  muted: "#94A3B8",
  school: "#7C3AED",
};

/**
 * A round, coloured marker. Leaflet's default marker images are resolved relative to its CSS, which
 * a bundler rewrites and breaks; an inline div needs no image at all.
 */
export const pinIcon = (color, glyph = "", size = 34) =>
  L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;color:#fff;
      align-items:center;justify-content:center;font:700 ${Math.round(size * 0.45)}px/1 sans-serif">${glyph}</div>`,
  });

/**
 * The page LeafletMap loads into its WebView (or an iframe on web): Leaflet on OpenStreetMap, the
 * same library, version and tiles the web portal uses (frontend/src/components/maps/osm.js).
 *
 * Leaflet is fetched from unpkg with Subresource Integrity. The two hashes below were checked
 * against the leaflet@1.9.4 files the web portal installs, so a CDN serving anything else is
 * refused rather than run. The map needs the internet for its tiles anyway, so a bundled copy
 * would not make it work offline.
 *
 * The page draws nothing on its own. The app sends it a state — markers, circles, lines — through
 * `window.renderMap(state)` (native) or a `{ type: 'render', state }` message (web), and the page
 * reports back `ready`, `error` and `press` (a tap on the map).
 */

export const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Where a map opens before it has anything to show. */
export const DEFAULT_CENTRE = { lat: 26.9124, lng: 75.7873 };

/** Same colours as the web portal's maps, so a stop or a school looks alike on both. */
export const MAP_COLORS = {
  primary: '#2563EB',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  muted: '#94A3B8',
  school: '#7C3AED',
  stale: '#64748B',
};

export function buildLeafletHtml({ centre = DEFAULT_CENTRE, zoom = 13 } = {}) {
  const lat = Number.isFinite(centre?.lat) ? centre.lat : DEFAULT_CENTRE.lat;
  const lng = Number.isFinite(centre?.lng) ? centre.lng : DEFAULT_CENTRE.lng;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${LEAFLET_CSS}" integrity="${LEAFLET_CSS_SRI}" crossorigin="" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #E5E7EB; }
  .leaflet-tooltip { font: 600 12px/1.3 sans-serif; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function send(message) {
    var text = JSON.stringify(message);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent && window.parent !== window) window.parent.postMessage(text, '*');
  }
  function failed() { send({ type: 'error' }); }
</script>
<script src="${LEAFLET_JS}" integrity="${LEAFLET_JS_SRI}" crossorigin="" onerror="failed()"></script>
<script>
(function () {
  if (!window.L) { failed(); return; }

  var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('${OSM_TILE_URL}', { attribution: '${OSM_ATTRIBUTION}', maxZoom: 19 }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var fitted = false;
  var followed = null;

  // Labels are stop and school names typed by people; Leaflet puts tooltip text in as HTML.
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function valid(p) { return p && isFinite(p.lat) && isFinite(p.lng); }
  function pin(color, glyph, size) {
    return L.divIcon({
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + esc(color) +
        ';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;' +
        'justify-content:center;color:#fff;font:700 ' + Math.round(size * 0.45) + 'px/1 sans-serif">' +
        esc(glyph || '') + '</div>'
    });
  }

  window.renderMap = function (state) {
    state = state || {};
    layer.clearLayers();
    var bounds = null;
    function grow(b) { bounds = bounds ? bounds.extend(b) : b; }

    (state.circles || []).forEach(function (c) {
      if (!valid(c) || !(c.radius > 0)) return;
      L.circle([c.lat, c.lng], {
        radius: c.radius, color: c.color, weight: c.weight || 2,
        fillOpacity: c.fillOpacity == null ? 0.08 : c.fillOpacity,
        dashArray: c.dashed ? '4 4' : null
      }).addTo(layer);
      grow(L.latLng(c.lat, c.lng).toBounds(c.radius * 2));
    });

    (state.lines || []).forEach(function (line) {
      var points = (line.points || []).filter(valid);
      if (points.length < 2) return;
      L.polyline(points.map(function (p) { return [p.lat, p.lng]; }), {
        color: line.color, weight: line.weight || 3, opacity: line.opacity || 1,
        dashArray: line.dashed ? '6 8' : null
      }).addTo(layer);
      points.forEach(function (p) { grow(L.latLng(p.lat, p.lng).toBounds(60)); });
    });

    (state.markers || []).forEach(function (m) {
      if (!valid(m)) return;
      var marker = L.marker([m.lat, m.lng], { icon: pin(m.color, m.glyph, m.size || 28) }).addTo(layer);
      if (m.label) marker.bindTooltip(esc(m.label), m.labelAlways ? { permanent: true, direction: 'top', offset: [0, -14] } : {});
      grow(L.latLng(m.lat, m.lng).toBounds(80));
    });

    // Frame everything the first time there is something to frame (or every time, when asked).
    // Refitting on every update would yank the map away from someone looking at part of it.
    if (bounds && (state.fit === 'always' || !fitted)) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 17 });
      fitted = true;
    } else if (valid(state.follow)) {
      var key = state.follow.lat + ',' + state.follow.lng;
      if (followed !== null && followed !== key) map.panTo([state.follow.lat, state.follow.lng], { animate: true });
    }
    if (valid(state.follow)) followed = state.follow.lat + ',' + state.follow.lng;
  };

  map.on('click', function (e) { send({ type: 'press', lat: e.latlng.lat, lng: e.latlng.lng }); });
  window.addEventListener('message', function (event) {
    try {
      var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type === 'render') window.renderMap(data.state);
    } catch (e) { /* not ours */ }
  });
  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
}

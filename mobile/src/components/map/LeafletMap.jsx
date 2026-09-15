import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../../theme/ThemeProvider';
import { buildLeafletHtml } from './leafletHtml';

// Past this with no word from the page, Leaflet or the network has failed quietly — say so rather
// than leaving a grey box that looks like it is still thinking.
const LOAD_TIMEOUT_MS = 15000;

const firstPoint = ({ markers, circles, lines }) =>
  [...markers, ...circles, ...lines.flatMap((line) => line.points ?? [])].find(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
  ) ?? null;

/**
 * The app's one map: Leaflet on OpenStreetMap, the same map the web portal draws, inside a WebView.
 *
 * No Google Maps API key, no native maps module, and it runs in Expo Go. The page itself lives in
 * ./leafletHtml.js; this component only hands it what to draw and listens for what it says back.
 *
 * Props
 *   markers  [{ lat, lng, color, glyph, label, labelAlways, size }]
 *   circles  [{ lat, lng, radius, color, fillOpacity, dashed }]
 *   lines    [{ points: [{ lat, lng }], color, weight, dashed, opacity }]
 *   fit      'once' (default) frames everything the first time, then leaves the view alone;
 *            'always' reframes on every change
 *   follow   { lat, lng } — pans to it whenever it moves (a bus)
 *   onPress  (lat, lng) => void — a tap on the map
 *   height   number
 */
export function LeafletMap({ markers = [], circles = [], lines = [], fit = 'once', follow = null, onPress, height = 240, style }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [status, setStatus] = useState('loading');
  const webRef = useRef(null);
  const frameRef = useRef(null);

  // The page is built once, centred on whatever the first data was; after that only the state
  // changes, so a moving bus does not reload the whole map on every position.
  const html = useMemo(() => {
    const start = firstPoint({ markers, circles, lines });
    return buildLeafletHtml(start ? { centre: start, zoom: 15 } : { zoom: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateJson = JSON.stringify({ markers, circles, lines, fit, follow });

  const onPageMessage = useCallback(
    (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        return;
      }
      if (message?.type === 'ready') setStatus('ready');
      else if (message?.type === 'error') setStatus('error');
      else if (message?.type === 'press') onPress?.(message.lat, message.lng);
    },
    [onPress]
  );

  useEffect(() => {
    if (status !== 'loading') return undefined;
    const timer = setTimeout(() => setStatus((s) => (s === 'loading' ? 'error' : s)), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  // Send the current state whenever it changes, once the page can take it.
  useEffect(() => {
    if (status !== 'ready') return;
    if (Platform.OS === 'web') {
      frameRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'render', state: JSON.parse(stateJson) }), '*');
    } else {
      webRef.current?.injectJavaScript(`window.renderMap && window.renderMap(${stateJson}); true;`);
    }
  }, [status, stateJson]);

  // On web the page is an iframe and talks through window messages.
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const listener = (event) => {
      if (event.source === frameRef.current?.contentWindow && typeof event.data === 'string') onPageMessage(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onPageMessage]);

  const box = [
    { height, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    style,
  ];

  if (status === 'error') {
    return (
      <View style={[box, { alignItems: 'center', justifyContent: 'center', padding: spacing.lg }]}>
        <Icon source="map-marker-off-outline" size={32} color={colors.textMuted} />
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
          The map could not load. It needs an internet connection — everything else on this screen still works.
        </Text>
      </View>
    );
  }

  return (
    <View style={box}>
      {Platform.OS === 'web' ? (
        <iframe ref={frameRef} srcDoc={html} title="Map" style={{ border: 0, width: '100%', height: '100%' }} />
      ) : (
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          // OpenStreetMap's tile policy asks web pages for a Referer and apps for a User-Agent that
          // names them. A page loaded from a bare HTML string has no origin to send, so it is given
          // one, and the app is named in the User-Agent.
          source={{ html, baseUrl: 'https://localhost/' }}
          applicationNameForUserAgent="SchoolERP-Mobile"
          javaScriptEnabled
          domStorageEnabled
          onMessage={(event) => onPageMessage(event.nativeEvent.data)}
          onError={() => setStatus('error')}
          // Panning the map must move the map, not the screen it sits in.
          nestedScrollEnabled
          scrollEnabled={false}
          overScrollMode="never"
          setBuiltInZoomControls={false}
          style={{ backgroundColor: 'transparent' }}
        />
      )}
      {status === 'loading' ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

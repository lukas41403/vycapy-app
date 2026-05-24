/**
 * LeafletMap — generický wrapper okolo Leaflet vo WebView.
 *
 * Použitie:
 *   <LeafletMap
 *     center={{ lat: 48.395, lng: 18.125 }}
 *     zoom={15}
 *     markers={[
 *       { id: '1', lat: 48.395, lng: 18.125, color: '#C62828', emoji: '🏛️', label: 'Obecný úrad' },
 *     ]}
 *     onMarkerPress={(id) => console.log('Klik:', id)}
 *   />
 *
 * ─── Prečo Leaflet vo WebView ────────────────────────────────────────────
 * - Žiadny API kľúč (na rozdiel od Google Maps)
 * - Žiadny natívny build (na rozdiel od react-native-maps)
 * - Open-source pod permisívnou MIT licenciou
 * - OpenStreetMap je perfektne pokrytá Slovenskom, vrátane malých obcí
 * - WebView je súčasťou React Native, len `npx expo install react-native-webview`
 *
 * Komunikácia RN ↔ WebView:
 *   - Posielame iba prvotný HTML s embedovanými JSON dátami (markers)
 *   - WebView posiela správy späť cez `window.ReactNativeWebView.postMessage`
 *   - Format: { type: 'marker_press' | 'map_ready', id: string }
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius } from '@/src/theme/tokens'
import { useMemo, useRef } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'

// Defenzívne načítanie — ak WebView nie je nainštalovaný, ukáže sa fallback.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WebViewModule = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-webview')
  } catch {
    return null
  }
})()
const WebView = WebViewModule?.WebView ?? null

export type LeafletMarker = {
  id: string
  lat: number
  lng: number
  color: string       // farba pozadia pinu (#C62828)
  emoji: string       // emoji vykreslené v strede pinu
  label?: string      // popisok zobrazený v popup po kliku (HTML escape)
  active?: boolean    // ak true, pin pulzuje (napr. urgentné hlásenie)
}

export type LeafletCircle = {
  lat: number
  lng: number
  radiusMeters: number    // polomer v metroch
  color?: string          // border #RRGGBB (default brand red)
  fillOpacity?: number    // 0-1 (default 0.08)
  dashArray?: string      // SVG dash array, napr. "6,6"
}

type Props = {
  center: { lat: number; lng: number }
  zoom?: number
  markers: LeafletMarker[]
  /** Voliteľný kruh — používa sa na zobrazenie rádia v okolí obce. */
  circle?: LeafletCircle | null
  onMarkerPress?: (id: string) => void
  onMapReady?: () => void
  style?: StyleProp<ViewStyle>
  /** Ak true, mapa sa autozoomne aby zobrazila všetky pins. */
  fitBoundsToMarkers?: boolean
  /** Ak true a `circle` je zadaný, mapa sa autozoomne na kruh. */
  fitBoundsToCircle?: boolean
  /** Voliteľný "vrstvy" — admin pohľad s prepínačom satelit/cesty.
   *  V základnej verzii ponecháme len OSM. */
  tileLayer?: 'osm' | 'osm-hot' | 'esri-sat'
}

// HTML escape pre popup text
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!))
}

const TILE_URLS: Record<NonNullable<Props['tileLayer']>, { url: string; attribution: string; max: number }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    max: 19,
  },
  'osm-hot': {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap, Humanitarian OSM Team',
    max: 19,
  },
  'esri-sat': {
    // Esri World Imagery — satelitné zobrazenie, zadarmo pre nekomerčné použitie
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    max: 19,
  },
}

/** Build Leaflet HTML s embedovanými dátami. */
function buildHtml(props: {
  center: { lat: number; lng: number }
  zoom: number
  markers: LeafletMarker[]
  circle: LeafletCircle | null
  fitBoundsToMarkers: boolean
  fitBoundsToCircle: boolean
  tileLayer: NonNullable<Props['tileLayer']>
}): string {
  const tile = TILE_URLS[props.tileLayer]
  const markersJson = JSON.stringify(props.markers.map(m => ({
    id: m.id, lat: m.lat, lng: m.lng, color: m.color, emoji: m.emoji,
    label: m.label ? esc(m.label) : '',
    active: !!m.active,
  })))
  const circleJson = JSON.stringify(props.circle ?? null)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #E8F5E9; }
    body { -webkit-tap-highlight-color: transparent; touch-action: pan-x pan-y; }
    .vo-pin {
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,.35);
      font-size: 18px;
      color: white;
      font-weight: 900;
    }
    .vo-pin-pulse {
      animation: vo-pulse 1.6s infinite;
    }
    @keyframes vo-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(198,40,40,0.55), 0 2px 6px rgba(0,0,0,.35); }
      70%  { box-shadow: 0 0 0 14px rgba(198,40,40,0.0), 0 2px 6px rgba(0,0,0,.35); }
      100% { box-shadow: 0 0 0 0 rgba(198,40,40,0.0), 0 2px 6px rgba(0,0,0,.35); }
    }
    .leaflet-popup-content {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 10px 14px;
      font-size: 13px;
      font-weight: 600;
    }
    .vo-popup-btn {
      display: inline-block;
      margin-top: 6px;
      padding: 6px 12px;
      background: #C62828;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.2px;
    }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    (function() {
      var post = function(obj) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(obj));
          }
        } catch (e) {}
      };

      var map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        tap: true,
      }).setView([${props.center.lat}, ${props.center.lng}], ${props.zoom});

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(${JSON.stringify(tile.url)}, {
        maxZoom: ${tile.max},
        attribution: ${JSON.stringify(tile.attribution)},
      }).addTo(map);

      // Rádius kruh (voliteľný)
      var circleData = ${circleJson};
      var circleLayer = null;
      if (circleData) {
        circleLayer = L.circle([circleData.lat, circleData.lng], {
          radius: circleData.radiusMeters,
          color: circleData.color || '#C62828',
          weight: 2,
          opacity: 0.8,
          fillColor: circleData.color || '#C62828',
          fillOpacity: (typeof circleData.fillOpacity === 'number') ? circleData.fillOpacity : 0.08,
          dashArray: circleData.dashArray || '6,6',
          interactive: false,
        }).addTo(map);

        // Center pin obce — malá ikona uprostred kruhu
        var centerIcon = L.divIcon({
          html: '<div style="width:20px;height:20px;border-radius:50%;background:' + (circleData.color || '#C62828') + ';border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.4);"></div>',
          className: '',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        L.marker([circleData.lat, circleData.lng], { icon: centerIcon, interactive: false, keyboard: false }).addTo(map);
      }

      var markers = ${markersJson};
      var bounds = [];
      var lastMarker = null;

      markers.forEach(function(m) {
        var html = '<div class="vo-pin ' + (m.active ? 'vo-pin-pulse' : '') + '" style="background:' + m.color + '">' + m.emoji + '</div>';
        var icon = L.divIcon({
          html: html,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -16],
        });
        var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
        bounds.push([m.lat, m.lng]);

        // Popup HTML
        var popup = '<div><strong>' + (m.label || 'Bod') + '</strong></div>' +
                    '<a class="vo-popup-btn" href="#" onclick="window.__voPress(\\'' + m.id + '\\');return false;">Otvoriť detail</a>';
        marker.bindPopup(popup, { maxWidth: 220 });
        marker.on('click', function() { /* default popup */ });
        lastMarker = marker;
      });

      // Globálna helper funkcia pre klik z popupu
      window.__voPress = function(id) {
        post({ type: 'marker_press', id: id });
      };

      ${props.fitBoundsToCircle ? `
      if (circleLayer) {
        try { map.fitBounds(circleLayer.getBounds(), { padding: [20, 20] }); } catch (e) {}
      }
      ` : props.fitBoundsToMarkers ? `
      if (bounds.length > 1) {
        try { map.fitBounds(bounds, { padding: [40, 40] }); } catch (e) {}
      } else if (bounds.length === 1) {
        map.setView(bounds[0], ${Math.max(props.zoom, 15)});
      }
      ` : ''}

      // Signal ready
      post({ type: 'map_ready' });
    })();
  </script>
</body>
</html>`
}

export function LeafletMap({
  center,
  zoom = 15,
  markers,
  circle = null,
  onMarkerPress,
  onMapReady,
  style,
  fitBoundsToMarkers = true,
  fitBoundsToCircle = false,
  tileLayer = 'osm',
}: Props) {
  const t = useThemeColors()
  const webRef = useRef<any>(null)

  const html = useMemo(
    () => buildHtml({
      center, zoom, markers, circle,
      fitBoundsToMarkers, fitBoundsToCircle, tileLayer,
    }),
    [center.lat, center.lng, zoom, markers, circle, fitBoundsToMarkers, fitBoundsToCircle, tileLayer],
  )

  if (!WebView) {
    return (
      <View style={[styles.fallback, { backgroundColor: t.surfaceAlt, borderColor: t.border }, style]}>
        <Text style={[styles.fallbackEmoji]}>🗺️</Text>
        <Text style={[styles.fallbackTitle, { color: t.text }]}>Mapa vyžaduje WebView</Text>
        <Text style={[styles.fallbackText, { color: t.textMuted }]}>
          Pre zobrazenie reálnej mapy obce nainštalujte balík:
        </Text>
        <View style={[styles.codeBox, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.code, { color: t.text }]} selectable>
            npx expo install react-native-webview
          </Text>
        </View>
        <Text style={[styles.fallbackText, { color: t.textMuted, marginTop: 8 }]}>
          Po inštalácii reštartujte Expo cez `npx expo start -c`.
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        bounces={false}
        nestedScrollEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: t.surfaceAlt }]}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam mapu…</Text>
          </View>
        )}
        onMessage={(e: any) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: string }
            if (msg.type === 'marker_press' && msg.id && onMarkerPress) {
              onMarkerPress(msg.id)
            } else if (msg.type === 'map_ready' && onMapReady) {
              onMapReady()
            }
          } catch {
            // Ignoruj nevalidné správy
          }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 360,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  web: { flex: 1, backgroundColor: '#E8F5E9' },
  loading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },
  fallback: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fallbackEmoji: { fontSize: 48 },
  fallbackTitle: { fontSize: 16, fontWeight: '800' },
  fallbackText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  codeBox: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  code: { fontFamily: 'monospace', fontSize: 12 },
})

export default LeafletMap

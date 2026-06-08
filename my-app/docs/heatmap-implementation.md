# HeatMap Implementation

## Overview

The HeatMap renders a colored temperature grid overlay on 3D Tiles (buildings) using Cesium's `ClassificationPrimitive` API. When activated, it fetches temperature data for the current view center and projects colored rectangles onto all 3D model surfaces in the area. Terrain is intentionally excluded — the overlay covers buildings only.

## How It Works

```
User clicks "HeatMap" button
       │
       ▼
  Check centerLocation or downtownLocation exists
       │
       ├── No  → Show warning: "Please search a location..."
       │
       └── Yes → Fetch 8×8 temperature grid from /api/temperature
                    │
                    ▼
              Bilinear interpolation (×2 smoothing pass → 15×15)
                    │
                    ▼
              Create ClassificationPrimitive per cell (15×15 grid)
                    │
                    ▼
              Render colored rectangles on 3D Tiles (CESIUM_3D_TILE)
```

### Success Indicator

A green toast **"Heat Map Applied"** with a checkmark appears top-right when data renders. Auto-dismisses after 3 seconds.

### Stale-Response Protection

A race condition occurred when the user searched a new city while the previous heatmap fetch was still in flight. The late response from the first city would overwrite the second city's data:

```
Time ──────────────────────────────────────────────►
  │ fetchTempPoints(Tokyo) starts       ← API call 1
  │     │
  │     └─ user searches "Brooklyn"
  │ fetchTempPoints(Brooklyn) starts    ← API call 2
  │     │
  │     ├─ API call 2 responds → OK, shows Brooklyn
  │     └─ API call 1 responds → OVERWRITES with Tokyo! ← BUG
```

**Fix**: Each `fetchTempPoints` call increments `fetchIdRef`. Before processing the response, it checks whether the fetch ID still matches `fetchIdRef.current`. If a newer fetch was started, the stale response is silently discarded.

### Camera-Settle Re-Fetch

When searching a new location, `flyToLocation` uses a two-stage flyTo (space → ground). The camera moves continuously, so the 500ms debounce on `camera.changed` never fires until the final zoom completes.

**Fix**: A `camera.moveEnd` listener resets `lastFetchPosRef.current = null` and increments `heatmapSettleKey`. This triggers the fetch effect unconditionally, guaranteeing fresh data at the settled camera position.

### Re-Fetch Triggers

1. **Camera settles** — `camera.moveEnd` resets `lastFetchPosRef` and increments `heatmapSettleKey`.
2. **Camera pans > 0.3°** — distance check in the fetch effect against `lastFetchPosRef`.
3. **Heatmap toggled on** — fires immediately at the current center location.

## API Route (`app/api/temperature/route.ts`)

### Endpoint

```
GET /api/temperature?lat=37.77&lng=-122.42&spacing=0.025&rows=8&cols=8
```

Returns `{ points: [{latitude, longitude, tempC}], spacing, rows, cols }`.

### OpenWeatherMap Integration

When `OPENWEATHERMAP_API_KEY` is set in `.env`, each grid cell is fetched from the One Call API 3.0. Without the key, demo synthetic data is used.

### Rate Limiting (Free Tier: 60 RPM)

Three layers of protection to stay under the 60 RPM limit:

1. **Sliding-window counter**: Before each cell API call, the server checks how many calls were made in the last 60 seconds. If ≥ 55 calls, remaining cells are filled with interpolated estimates (`estimateCellTemp`) — no error is thrown.

2. **Per-location cache**: Grid results are cached in-memory for 15 minutes, keyed by rounded `lat,lng,rows,cols,spacing`. Revisiting the same area (e.g. after panning away and back) returns cached data instantly with zero API calls.

3. **Reduced grid**: 8×8 grid (64 cells) instead of the original 16×16 (256 cells). At ~55 RPM, the first fetch uses ~55 real API calls + ~9 estimated cells. Cache handles subsequent requests.

### Rate Limiter Implementation

```typescript
const requestTimestamps: number[] = [];
const RPM_LIMIT = 55;
const WINDOW_MS = 60_000;

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RPM_LIMIT) return false;
  requestTimestamps.push(now);
  return true;
}
```

### Fallback Estimation

When rate-limited, `estimateCellTemp` interpolates from nearby successfully-fetched cells using inverse-distance weighting. If no cells succeeded yet, defaults to 20°C.

## Smoothing (Bilinear Interpolation)

The raw 8×8 API grid is upsampled by factor 2 to 15×15 using bilinear interpolation (`smoothGrid()`). Each new cell is the weighted average of its four surrounding raw data points.

## Color Palette

```
Low  → #fff33b (pale yellow)
       #fdc70c (yellow)
       #f3903f (orange)
       #ed683c (red-orange)
High → #e93e3a (deep red)
```

Colors interpolated linearly between stops. Alpha 200/255 so buildings remain visible underneath.

## 3D Tiles Performance

- `maximumScreenSpaceError={4}` — high-detail rendering
- `cullRequestsWhileMoving` — skips tile requests while camera is in motion
- `globe.enableLighting = true` + `sun.show = true` — auto day/night cycle

## ClassificationPrimitive vs Entity Rectangle

| Approach | Terrain | 3D Tiles | Issue |
|----------|---------|----------|-------|
| `Entity` + `rectangle` with `height: 0` | ✅ | ❌ | Under buildings |
| `ClassificationPrimitive` (current) | ❌ | ✅ | Buildings only — `CESIUM_3D_TILE` |

## Key Files

- `components/CesiumMap.tsx` — HeatMap button, fetch logic, `ClassificationPrimitive` management, smoothing, camera tracking, My Location button, Like button
- `app/api/temperature/route.ts` — Temperature data source with rate limiting and caching
- `docs/heatmap-implementation.md` — This file
- `app/viewer/page.tsx` — Viewer page with toolbar (Dashboard, Search, 3D toggle, My Location, Like), query-param navigation, sign-in prompt

## Related Features

### My Location Button

Uses `navigator.geolocation.getCurrentPosition` with high accuracy, reverse-geocodes via Nominatim, and calls `flyToLocation` + sets `currentCity` so Like/HeatMap work immediately. Button shows "Locating…" with disabled state during request.

### Like / Save Locations

- Logged-in users: likes/saves are persisted to PostgreSQL via API routes (`/api/locations`, `/api/locations/[id]`)
- Anonymous users: a large centered bubble appears with "Sign in to save this location" + a "Sign In / Register" button linking to `/login`

### Dashboard → Viewer Navigation

Clicking "Fly" on a liked or saved location in the dashboard navigates to `/viewer?lat=X&lng=Y&name=Z`. The viewer reads these query params on mount and flies to the location.

### Export Data

The (removed) Quick Actions section previously had an Export Data button that downloaded locations and notes as a JSON file.

## Troubleshooting

**"Please search a location to apply heatmap to."** — Search for a city or fly to a location first.

**Heatmap not visible** — Uses `ClassificationType.CESIUM_3D_TILE` — only renders on 3D models, not terrain. Verify tileset is loaded.

**Heatmap still shows old city data** — Stale-response race condition; verify `fetchIdRef` logic is working in latest code.

**No real data shown** — Set `OPENWEATHERMAP_API_KEY` in `.env`. Without it, demo synthetic data is used.

**Rate limit warnings in console** — Normal. The app degrades gracefully by estimating cells from nearby data. Increase `RPM_LIMIT` if you upgrade to a higher-tier OWM plan.

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
       └── Yes → Fetch 16×16 temperature grid from /api/temperature
                    │
                    ▼
              Bilinear interpolation (×2 smoothing pass)
                    │
                    ▼
              Create ClassificationPrimitive per cell (31×31 grid)
                    │
                    ▼
              Render colored rectangles on terrain + 3D Tiles
```

### Success Indicator

When the heatmap data is successfully fetched and rendered, a green toast appears at the top-right showing **"Heat Map Applied"** with a checkmark icon. It auto-dismisses after 3 seconds.

### Stale-Response Protection

A race condition occurred when the user searched a new city while the previous heatmap fetch was still in flight. The late response from the first city would overwrite the second city's data:

```
Time ──────────────────────────────────────────────►
  │ fetchTempPoints(Tokyo) starts       ← API call 1
  │     │
  │     └─ user searches "Brooklyn"
  │ fetchTempPoints(Brooklyn) starts    ← API call 2
  │     │
  │     ├─ API call 2 responds → ❌ OK, shows Brooklyn
  │     └─ API call 1 responds → ❌ OVERWRITES with Tokyo! ← BUG
```

**Fix**: Each `fetchTempPoints` call increments `fetchIdRef`. Before processing the response, it checks whether the fetch ID still matches `fetchIdRef.current`. If a newer fetch was started, the stale response is silently discarded.

### Camera-Settle Re-Fetch

When searching a new location, `flyToLocation` uses a two-stage flyTo (space → ground). The camera moves continuously, so the 500ms debounce on `camera.changed` never fires until the final zoom completes.

**Fix**: A `camera.moveEnd` listener resets `lastFetchPosRef.current = null` and increments `heatmapSettleKey` when the camera stops moving. This triggers the fetch effect unconditionally (since `lastFetchPos` is null), guaranteeing the heatmap is always fetched for the settled camera position.

### Data Flow

1. **Button click** — validates that a location is available (`centerLocation` from camera or `downtownLocation` from tileset)
2. **API fetch** — calls `/api/temperature?lat=X&lng=Y&spacing=0.015&rows=16&cols=16` returning a 16×16 grid (256 points) and `{spacing, rows, cols}` metadata
3. **Smoothing** — bilinear interpolation upsamples the grid by factor 2 (→ 31×31 = 961 points) for smooth color transitions
4. **Color mapping** — each point is mapped to a color via the `tempToColor` function using a 5-stop palette with linear interpolation
5. **Rendering** — `ClassificationPrimitive` instances per cell with `classificationType: ClassificationType.CESIUM_3D_TILE` (buildings only, not terrain)

## Smoothing (Bilinear Interpolation)

The raw 16×16 API grid can have visible cell boundaries. The frontend applies a bilinear interpolation pass (`smoothGrid()`) that upsamples by factor 2:

```
   Original 4×4 grid          Interpolated 7×7 grid
   ┌──┬──┬──┬──┐              ┌──┬──┬──┬──┬──┬──┬──┐
   │  │  │  │  │              │  │  │  │  │  │  │  │
   ├──┼──┼──┼──┤     ×2       ├──┼──┼──┼──┼──┼──┼──┤
   │  │  │  │  │    ──────▶   │  │  │  │  │  │  │  │
   ├──┼──┼──┼──┤              ├──┼──┼──┼──┼──┼──┼──┤
   │  │  │  │  │              │  │  │  │  │  │  │  │
   ├──┼──┼──┼──┤              ├──┼──┼──┼──┼──┼──┼──┤
   │  │  │  │  │              │  │  │  │  │  │  │  │
   └──┴──┴──┴──┘              └──┴──┴──┴──┴──┴──┴──┘
```

Each new cell's temperature is the weighted average of its four surrounding raw data points, producing a smoother visual gradient.

## Re-Fetch Triggers

The heatmap re-fetches in three scenarios:

1. **Camera settles** — When the camera finishes moving (`camera.moveEnd`), `lastFetchPosRef` is reset and `heatmapSettleKey` is incremented. The fetch effect depends on `heatmapSettleKey`, so a fresh fetch always occurs at the settled position. This is the primary mechanism after a geocode search.

2. **Camera pans > 0.3°** — When the camera moves more than 0.3° (~33 km) from the last fetch position. This covers gradual panning. Tracked via `lastFetchPosRef`.

3. **Heatmap toggled on** — Fires immediately at the current center location.

## Why ClassificationPrimitive Instead of Entity Rectangle

| Approach | Terrain | 3D Tiles | Issue |
|----------|---------|----------|-------|
| `Entity` + `rectangle` with `height: 0` | ✅ | ❌ | Under buildings, clips into terrain |
| `Entity` + `rectangle` + `classificationType` cast | ❌ | ❌ | Resium doesn't forward the property reliably |
| `ClassificationPrimitive` (current) | ✅ | ✅ | Correctly overlays on all surfaces |

`ClassificationPrimitive` is Cesium's low-level primitive designed specifically for this use case. It projects geometry onto the surface of terrain, 3D Tiles, or both — unlike Entity rectangles which sit at a fixed height on the terrain.

## Color Palette

```
Low  → #fff33b (pale yellow)
       #fdc70c (yellow)
       #f3903f (orange)
       #ed683c (red-orange)
High → #e93e3a (deep red)
```

Colors are interpolated linearly between stops. Semi-transparent (alpha 200/255) so buildings remain visible underneath.

## OpenWeatherMap Integration

The API route checks for `OPENWEATHERMAP_API_KEY` in `.env`. When present, it fetches real per-cell temperature data from the One Call API 3.0 instead of generating synthetic values.

### Setup

```bash
# .env
OPENWEATHERMAP_API_KEY=your_key_here
```

### Fallback Behavior

If no API key is set, the endpoint generates demo data with a synthetic temperature gradient. Real API calls use `AbortSignal.timeout(4000)` per cell — if a cell fails (timeout/error), it defaults to 20°C for that cell instead of failing the entire request.

### Rate Limiting

A 16×16 grid makes up to 256 API calls per fetch. OpenWeatherMap's free tier allows 1,000 calls/day. To reduce usage:
- Reduce grid to 8×8 (64 calls) via `rows=8&cols=8` in `fetchTempPoints`
- Increase spacing to cover larger area with fewer cells

## 3D Tiles Performance

### Draco Compression

CesiumJS 1.116+ natively supports Draco-compressed glTF 2.0 tiles. The Draco decoder is bundled in the Cesium Workers and loaded automatically from:

```
CESIUM_BASE_URL/Workers/
```

**Client side**: No code changes needed — Cesium auto-detects and decompresses Draco content.

**Source side**: To compress your own 3D Tiles, use `gltf-pipeline`:
```bash
npx gltf-pipeline -i model.gltf -o model_draco.gltf -d
```

### Tileset Options

The `Cesium3DTileset` is configured with:
- `maximumScreenSpaceError={4}` — high-detail rendering
- `cullRequestsWhileMoving` — skips tile requests while camera is in motion for smoother interaction

## Key Files

- `components/CesiumMap.tsx` — HeatMap button, fetch logic, `ClassificationPrimitive` management, smoothing, camera tracking
- `app/api/temperature/route.ts` — Temperature data source (OpenWeatherMap or demo)
- `docs/heatmap-implementation.md` — This file

## Troubleshooting

**"Please search a location to apply heatmap to."**
No location data available. Search for a city or fly to a location first.

**Heatmap not visible**
The heatmap uses `ClassificationType.CESIUM_3D_TILE` — it only renders on 3D models, not terrain. Verify the 3D tileset is loaded (`sceneState` shows "ready") and buildings are visible in the current view. If no buildings are nearby, the overlay has nothing to project onto.

**Heatmap still shows old city data after searching a new one**
This was a race condition with stale API responses. Fixed via `fetchIdRef` — stale responses are now discarded. Verify you're running the latest code.

**Colors look wrong / too blocky**
The 16×16 grid with 2× smoothing produces 31×31 cells. If still blocky, increase `GRID_ROWS`/`GRID_COLS` or `SMOOTH_FACTOR` in `CesiumMap.tsx`.

**No real data shown**
Set `OPENWEATHERMAP_API_KEY` in `.env`. Without it, demo synthetic data is used.

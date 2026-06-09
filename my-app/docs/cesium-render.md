# Cesium Rendering — Architecture Overview

## Summary
- The 3D viewer is built on Cesium + Resium (React bindings) inside a Next.js app.
- Core component: `CesiumMap.tsx` — handles viewer, terrain, 3D tiles, camera, location tracking, heatmap.

## Stack
- `cesium` — core 3D globe engine (WebGL, terrain, tilesets)
- `resium` — declarative React wrappers: `<Viewer>`, `<Cesium3DTileset>`
- `next/dynamic` with `ssr: false` — Cesium requires browser APIs, loaded client-only

## Dynamic Loading
```
app/viewer/page.tsx
  └─ dynamic(() => import("../../components/CesiumMap"), { ssr: false })
      └─ CesiumMap (forwardRef component, ~850 lines)
```

## Core Component: `CesiumMap.tsx`

### 1. Viewer
```tsx
<Viewer
  full
  animation={false}
  baseLayerPicker={false}
  fullscreenButton={false}
  geocoder={false}
  homeButton={false}
  infoBox={false}
  navigationHelpButton={false}
  sceneModePicker={false}
  selectionIndicator={false}
  shouldAnimate
  terrainProvider={terrainProvider}
  timeline={false}
/>
```
Default UI widgets disabled. `shouldAnimate` enables clock-based animation.

### 2. Terrain
Cesium World Terrain loaded via `createWorldTerrainAsync()`. Passed to `<Viewer terrainProvider>`. Without Ion token, terrain stays flat.

### 3. 3D Tiles (downtown model)
```tsx
<Cesium3DTileset
  url={tilesetSource}
  maximumScreenSpaceError={4}
  cullRequestsWhileMoving
  onReady={handleTilesetReady}
  onInitialTilesLoad={handleInitialTilesLoad}
  onError={handleTilesetError}
  onTileFailed={handleTilesetError}
/>
```
- `tilesetSource` = direct URL (`NEXT_PUBLIC_3DTILES_URL`) or Ion asset (`NEXT_PUBLIC_DOWNTOWN_ASSET_ID`, default `96188` — downtown Los Angeles).
- `maximumScreenSpaceError: 4` for high-detail LOD.
- Visibility toggled via `modelsVisible` state, exposed through imperative handle.

### 4. Camera System

**Fly-to modes:**
- `flyToDowntown()` — zooms to 3D tileset bounding sphere.
- `flyToLocation(lat, lng)` — two-stage: high altitude (50,000 km) → globe spin → 500m above terrain.
- Preset views: overview, north, south, street — each a `HeadingPitchRange` offset.

**Constraints:**
- `setupCameraConstraints()` subscribes to `camera.changed`. If `sampleHeight` puts camera below terrain + 10m threshold, camera is corrected upward.

**Center tracking:**
- Debounced `camera.changed` listener (500ms). Picks viewport center via `scene.globe.pick(ray)`. Falls back to camera position if no terrain hit.

### 5. Location Info Overlay (bottom-left)

As the user pans, the overlay updates with (see `docs/location-info-overlay.md`):

```
Japan: Tokyo
23m · 35.67347, 139.76689
Tokyo was originally a small fishing village called Edo...
[More Details]
```

- **Name**: from Nominatim reverse geocode, formatted as `Country: City`.
- **Elevation**: from open-elevation.com API.
- **Fact**: from `/api/facts` endpoint (hardcoded DB for famous places, OpenAI for others).
- **More Details**: toggles full Nominatim address string.

All three fetches run in parallel via `Promise.all`, debounced 1s after camera settles.

### 6. Heatmap Overlay
Toggleable temperature heatmap using Cesium `ClassificationPrimitive` with `RectangleGeometry`, classified against `CESIUM_3D_TILE`. See `docs/heatmap-implementation.md`.

### 7. Imperative Handle (`CesiumMapRef`)

| Method | Action |
|---|---|
| `flyToDowntown()` | Zoom to downtown tileset |
| `selectView(id)` | Switch between preset camera angles |
| `flyToLocation(lat, lng, name?)` | Two-stage fly-to |
| `toggleModels()` | Show/hide 3D tileset |
| `getModelsVisible()` | Returns tileset visibility |

### 8. State Management

Key state variables:
- `sceneState` — `"idle" | "loading" | "ready" | "error"`
- `terrainProvider` — async-loaded terrain instance
- `downtownBounds` — tileset bounding sphere for camera framing
- `downtownLocation` — coordinates from tileset bounding sphere
- `centerLocation` / `centerPlaceName` / `centerElevation` / `centerFact` / `centerFullAddress` — current viewport center info
- `showDetails` — toggles expanded address view
- `modelsVisible` — tileset visibility
- `showHeatmap` / `tempPoints` — heatmap overlay state

### 9. Key Configuration (env vars)

- `NEXT_PUBLIC_CESIUM_ION_TOKEN` — Cesium Ion access token
- `NEXT_PUBLIC_3DTILES_URL` — direct 3D Tiles endpoint
- `NEXT_PUBLIC_DOWNTOWN_ASSET_ID` — Ion asset ID (default `96188`)
- `OPENWEATHERMAP_API_KEY` — for live temperature data (optional)
- `OPENAI_API_KEY` — for AI-generated location facts (optional)

## Viewer Page (`app/viewer/page.tsx`)

- **Toolbar**: Dashboard link, PlaceSearch, 3D toggle, My Location (GPS), Like button.
- **CityStatsDisplay**: Fixed bottom-left panel showing searched location's name, country, lat/lng, elevation.
- **Tutorial**: Shows on first visit if not completed (persisted via DB for logged-in users or localStorage for anonymous).
- **Query param navigation**: Accepts `?lat=X&lng=Y&name=Z` from dashboard "Fly" button.

## Rendering Flow

1. Viewer page renders → dynamic import of `CesiumMap`.
2. `CesiumMap` mounts `<Viewer>` with optional Cesium World Terrain.
3. `<Cesium3DTileset>` loads from Ion/URL → bounding sphere and location extracted.
4. Camera initializes to global view (`flyHome(1.0)`).
5. User pans → 500ms debounce → center location reverse-geocoded + elevation fetched + fact fetched.
6. Bottom-left overlay updates with place name, elevation, fact, and "More Details" button.

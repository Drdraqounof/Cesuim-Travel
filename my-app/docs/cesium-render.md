**Cesium Rendering — Architecture Overview**

Summary
- The 3D viewer is built on Cesium + Resium (React bindings) inside a Next.js app.
- Rendering is split across `CesiumMapShell.tsx` (dynamic wrapper) and `CesiumMap.tsx` (core component).

Stack
- `cesium` — core 3D globe engine (WebGL, terrain, tilesets, entities)
- `resium` — declarative React wrappers: `<Viewer>`, `<Cesium3DTileset>`, `<Entity>`
- `next/dynamic` with `ssr: false` — Cesium requires browser APIs so it's loaded client-only

Dynamic loading: `CesiumMapShell.tsx`
```
components/CesiumMapShell.tsx
  └─ dynamic(() => import("./CesiumMap"), { ssr: false })
      └─ CesiumMap (forwardRef component)
```
`CesiumMapShell` wraps the heavy `CesiumMap` in a `next/dynamic` import so the server never renders Cesium code. A loading fallback is shown while the chunk loads.

Cesium assets (`public/cesium/`)
- `scripts/copy-cesium-assets.mjs` copies `Assets/`, `ThirdParty/`, `Workers/`, `Widgets/` from `node_modules/cesium/Build/Cesium` to `public/cesium`.
- Runs via `postinstall` and `predev`/`prebuild`.
- `CESIUM_BASE_URL` is set to `"/cesium"` at module level:
  ```ts
  (globalThis as any).CESIUM_BASE_URL = "/cesium";
  ```

Core component: `CesiumMap.tsx`

**1. Viewer**

```tsx
<Viewer
  ref={viewerRef}
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
Default UI widgets are disabled. `shouldAnimate` enables clock-based animation.

**2. Terrain**

Cesium World Terrain is loaded asynchronously with `createWorldTerrainAsync()`. The provider is stored in React state and passed to `<Viewer terrainProvider={...}>`. If no Ion token is set, terrain stays flat (default).

**3. 3D Tiles (downtown model)**

```tsx
<Cesium3DTileset
  url={tilesetSource}
  maximumScreenSpaceError={4}
  onReady={handleTilesetReady}
  onInitialTilesLoad={handleInitialTilesLoad}
  onError={handleTilesetError}
  onTileFailed={handleTilesetError}
/>
```
- `tilesetSource` is either a direct `NEXT_PUBLIC_3DTILES_URL` or an `IonResource.fromAssetId()` using `NEXT_PUBLIC_DOWNTOWN_ASSET_ID` (default `96188`).
- `maximumScreenSpaceError: 4` controls LOD quality.
- On ready, the tileset's bounding sphere is extracted and used for camera fly-to views.
- Visibility is toggled with `modelsVisible` state (exposed via imperative handle).

**4. Camera system**

Fly-to locations:
- `flyToDowntown` — zooms to the tileset bounding sphere with a `HeadingPitchRange`.
- `flyToLocation(lat, lng)` — two-stage fly: first to high altitude (50,000 km) showing the globe, then down to 500 m above terrain.
- Downtown presets (overview, north, south, street level) — each defined as a `HeadingPitchRange` offset from the bounding sphere center.

Camera constraints:
- `setupCameraConstraints()` subscribes to `viewer.camera.changed`.
- If `sampleHeight` shows the camera is below terrain + 10 m threshold, the camera is corrected upward.

Underground camera handling:
- Logs warning with terrain height, camera height, correction amount and coordinates whenever it triggers.

Center-location tracking:
- On camera change (debounced 500 ms), picks the center of the viewport via `scene.globe.pick(ray)`.
- If no terrain intersection is found, falls back to camera position.
- Then calls `/api/geocode` to reverse-geocode the coordinates.

**5. Entity overlay (temperature example)**

Temperature data is rendered as Cesium `<Entity>` primitives with `cylinder` geometry:
- Height mapped from temperature (50–500 m range).
- Color mapped via `tempToColor()`: blue → yellow → red.
- Labels show temperature in °C with `LabelStyle.FILL_AND_OUTLINE` and black outline for readability.
- `distanceDisplayCondition` hides labels beyond 200 km.

Entities are rendered declaratively inside `<Viewer>` as children — Resium automatically manages their lifecycle.

**6. Imperative handle (`CesiumMapRef`)**

Exposed methods via `useImperativeHandle`:
| Method | Action |
|---|---|
| `flyToDowntown()` | Zoom to downtown tileset |
| `selectView(id)` | Switch between predefined camera angles |
| `flyToLocation(lat, lng, name?)` | Two-stage fly-to |
| `toggleModels()` | Show/hide the 3D tileset |
| `getModelsVisible()` | Returns tileset visibility |

**7. State management**

Component state is split into:
- `SceneState` — `"idle" | "loading" | "ready" | "error"` for the tileset lifecycle.
- `terrainProvider` — async-loaded terrain instance.
- `downtownBounds` — bounding sphere from the tileset, used for camera framing.
- `downtownLocation` / `realLocation` — coordinates from tileset bounding sphere and geocoding API.
- `elevationData` — combined Google + Cesium terrain elevation comparison.
- `centerLocation` / `centerAddress` — current viewport center with reverse-geocoded address.
- `modelsVisible` — tileset visibility toggle.
- `showTemps` / `tempPoints` — temperature overlay toggle and data.

Key configuration (env vars)
- `NEXT_PUBLIC_CESIUM_ION_TOKEN` — Cesium Ion access token (for terrain and Ion-hosted assets).
- `NEXT_PUBLIC_3DTILES_URL` — direct 3D Tiles endpoint (alternative to Ion).
- `NEXT_PUBLIC_DOWNTOWN_ASSET_ID` — Ion asset ID (default `96188`).

Rendering flow
1. Page renders `CesiumMapShell` → dynamic import of `CesiumMap`.
2. `CesiumMap` mounts `<Viewer>` with optional terrain provider.
3. `<Cesium3DTileset>` loads from Ion or URL → on ready, bounding sphere and location are extracted.
4. Camera initializes to a global view (`flyHome(1.0)`) then user can fly to downtown.
5. On camera move (debounced), center location is picked and reverse-geocoded.
6. Temperature overlay (toggle) renders cylinder entities.

Viewer routes
- `/viewer` — main 3D viewer page using `CesiumMapShell`.

If you want, I can document specific subsystems in more detail (e.g. camera constraints, terrain sampling, or adding new entity overlays).

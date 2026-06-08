"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  BoundingSphere,
  Cartesian3,
  Cartographic,
  Cartesian2,
  HeadingPitchRange,
  Ion,
  IonResource,
  Math as CesiumMath,
  Rectangle,
  ClassificationType,
  ClassificationPrimitive,
  GeometryInstance,
  RectangleGeometry,
  ColorGeometryInstanceAttribute,
  createWorldTerrainAsync,
  type Cesium3DTileset as Cesium3DTilesetPrimitive,
  type TerrainProvider,
  type Viewer as CesiumViewer,
  Color,
} from "cesium";
import {
  Cesium3DTileset,
  type CesiumComponentRef,
  Viewer,
} from "resium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const CESIUM_CDN = "https://cdn.jsdelivr.net/npm/cesium@1.141.0/Build/Cesium/";
const cesiumBaseUrl = process.env.NODE_ENV === "production"
  ? CESIUM_CDN
  : "/cesium";
(globalThis as typeof globalThis & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = cesiumBaseUrl;

const FALLBACK_DOWNTOWN_ASSET_ID = 96188;

export interface CesiumMapRef {
  flyToDowntown: () => void;
  selectView: (viewId: string) => void;
  flyToLocation: (latitude: number, longitude: number, name?: string) => void;
  toggleModels: () => void;
  getModelsVisible: () => boolean;
}

const DOWNTOWN_VIEWS = [
  {
    id: "overview",
    label: "Overview",
    description: "Wide orbit for the full downtown footprint.",
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-0.55), 950),
  },
  {
    id: "north",
    label: "North Edge",
    description: "Angle in from the north side of the core.",
    offset: new HeadingPitchRange(CesiumMath.toRadians(180), CesiumMath.toRadians(-0.42), 700),
  },
  {
    id: "south",
    label: "South Edge",
    description: "Look back across the southern corridor.",
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-0.42), 700),
  },
  {
    id: "street",
    label: "Street Level",
    description: "Closer pass to inspect the dense center blocks.",
    offset: new HeadingPitchRange(CesiumMath.toRadians(35), CesiumMath.toRadians(-0.18), 280),
  },
] as const;

type SceneState = "idle" | "loading" | "ready" | "error";
type DowntownLocation = {
  latitude: string;
  longitude: string;
  elevationMeters: string;
};


const CesiumMap = forwardRef<CesiumMapRef, {}>(function CesiumMap(_, ref) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
  const tilesetRef = useRef<Cesium3DTilesetPrimitive | null>(null);
  const [sceneState, setSceneState] = useState<SceneState>("loading");
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<TerrainProvider>();
  const [downtownBounds, setDowntownBounds] = useState<BoundingSphere | null>(null);
  const [downtownLocation, setDowntownLocation] = useState<DowntownLocation | null>(null);
  const [activeView, setActiveView] = useState<(typeof DOWNTOWN_VIEWS)[number]["id"]>("overview");
  const [modelsVisible, setModelsVisible] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapWarning, setHeatmapWarning] = useState("");
  const [heatmapSuccess, setHeatmapSuccess] = useState("");
  const [tempPoints, setTempPoints] = useState<Array<{latitude:number;longitude:number;tempC:number}>>([]);
  const [centerLocation, setCenterLocation] = useState<{lat:number;lng:number} | null>(null);
  const [locating, setLocating] = useState(false);
  const locationDebounceRef = useRef<number | null>(null);
  const initialViewSetRef = useRef(false);
  const heatmapPrimitivesRef = useRef<ClassificationPrimitive[]>([]);
  const lastFetchPosRef = useRef<{lat:number;lng:number} | null>(null);
  const gridSpacingRef = useRef(0.015);
  const fetchIdRef = useRef(0);
  const [heatmapSettleKey, setHeatmapSettleKey] = useState(0);

  const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim() ?? "";
  const tilesetUrl = process.env.NEXT_PUBLIC_3DTILES_URL?.trim() ?? "";
  const downtownAssetId = Number(
    process.env.NEXT_PUBLIC_DOWNTOWN_ASSET_ID ?? FALLBACK_DOWNTOWN_ASSET_ID,
  );

  if (ionToken) {
    Ion.defaultAccessToken = ionToken;
  }

  useImperativeHandle(ref, () => ({
    flyToDowntown: () => {
      flyToDowntownView("overview", downtownBounds);
    },
    selectView: (viewId: string) => {
      flyToDowntownView(viewId as (typeof DOWNTOWN_VIEWS)[number]["id"], downtownBounds);
    },
    toggleModels: () => {
      setModelsVisible(prev => !prev);
    },
    getModelsVisible: () => modelsVisible,
    flyToLocation: (latitude: number, longitude: number, name?: string) => {
      const viewer = viewerRef.current?.cesiumElement;
      if (!viewer) return;

      // First, fly to a high altitude to see the whole planet spinning
      const startAltitude = 50000000; // Start very far away to show entire planet
      
      // Sample terrain height at target location to position camera correctly
      const targetCartographic = Cartographic.fromDegrees(longitude, latitude);
      const terrainHeight = viewer.scene.sampleHeight(targetCartographic) ?? 0;
      const endAltitude = terrainHeight + 500; // 500m above ground level

      // Calculate heading to face the target location based on longitude
      const targetHeading = CesiumMath.toRadians(longitude);
      
      // Fly to high altitude first to show planet spinning
      const highAltitudeDestination = Cartesian3.fromDegrees(longitude, latitude, startAltitude);
      
      viewer.camera.flyTo({
        destination: highAltitudeDestination,
        duration: 3.5, // Longer duration to see spinning effect
        orientation: {
          heading: targetHeading,
          pitch: CesiumMath.toRadians(-25),
          roll: 0,
        },
        complete: () => {
          // After reaching high altitude, zoom down to the location
          const finalDestination = Cartesian3.fromDegrees(longitude, latitude, endAltitude);
          viewer.camera.flyTo({
            destination: finalDestination,
            duration: 2.0,
            orientation: {
              heading: targetHeading,
              pitch: CesiumMath.toRadians(-45),
              roll: 0,
            },
          });
        },
      });
    },
  }));

  useEffect(() => {
    let isActive = true;

    if (!ionToken) {
      setTerrainProvider(undefined);
      return () => {
        isActive = false;
      };
    }

    void createWorldTerrainAsync()
      .then(provider => {
        if (isActive) {
          setTerrainProvider(provider);
        }
      })
      .catch(error => {
        if (isActive) {
          const message = error instanceof Error ? error.message : "Unable to load terrain.";

          setSceneError(message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [ionToken]);

  const tilesetSource = useMemo(() => {
    if (tilesetUrl) {
      return tilesetUrl;
    }

    if (!ionToken) {
      return null;
    }

    return IonResource.fromAssetId(downtownAssetId);
  }, [downtownAssetId, ionToken, tilesetUrl]);

  const setupCameraConstraints = (viewer: CesiumViewer) => {
    const MIN_HEIGHT_ABOVE_GROUND = 10; // meters
    let cameraChangeListener: (() => void) | null = null;

    cameraChangeListener = () => {
      try {
        const cartographic = Cartographic.fromCartesian(viewer.camera.position);
        const height = viewer.scene.sampleHeight(cartographic);

        if (height !== undefined && cartographic.height < height + MIN_HEIGHT_ABOVE_GROUND) {
          // Camera is underground, move it up
          const oldHeight = cartographic.height;
          cartographic.height = height + MIN_HEIGHT_ABOVE_GROUND;
          const newPosition = Cartographic.toCartesian(cartographic);
          viewer.camera.position = newPosition;
          
          console.warn('[CesiumMap] Camera glitched underground - corrected', {
            terrainHeight: height.toFixed(2),
            cameraHeightBefore: oldHeight.toFixed(2),
            cameraHeightAfter: cartographic.height.toFixed(2),
            correctionAmount: (cartographic.height - oldHeight).toFixed(2),
            lat: CesiumMath.toDegrees(cartographic.latitude).toFixed(5),
            lng: CesiumMath.toDegrees(cartographic.longitude).toFixed(5),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('[CesiumMap] Camera constraint check failed', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
    };

    viewer.camera.changed.addEventListener(cameraChangeListener);

    return () => {
      if (cameraChangeListener) {
        viewer.camera.changed.removeEventListener(cameraChangeListener);
      }
    };
  };

  const handleTilesetReady = (tileset: Cesium3DTilesetPrimitive) => {
    const viewer = viewerRef.current?.cesiumElement;
    const boundingSphere = BoundingSphere.clone(tileset.boundingSphere);

    tilesetRef.current = tileset;

    setSceneError(null);
    setSceneState("ready");
    setDowntownBounds(boundingSphere ?? null);

    if (boundingSphere) {
      const downtownCartographic = Cartographic.fromCartesian(boundingSphere.center);

      setDowntownLocation({
        latitude: CesiumMath.toDegrees(downtownCartographic.latitude).toFixed(5),
        longitude: CesiumMath.toDegrees(downtownCartographic.longitude).toFixed(5),
        elevationMeters: downtownCartographic.height.toFixed(0),
      });
    }

    if (!viewer) {
      return;
    }

    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.sun!.show = true;
    setupCameraConstraints(viewer);
    viewer.scene.requestRender();
  };

  const handleInitialTilesLoad = () => {
    const tileset = tilesetRef.current;
    const viewer = viewerRef.current?.cesiumElement;

    const boundingSphere = downtownBounds ?? (tileset ? BoundingSphere.clone(tileset.boundingSphere) : undefined);

    if (!boundingSphere) {
      return;
    }

    setDowntownBounds(boundingSphere);

    // Set initial view to global Earth from space only once (avoid resetting on toggles)
    if (viewer && !initialViewSetRef.current) {
      viewer.camera.flyHome(1.0);
      initialViewSetRef.current = true;
      console.log("[CesiumMap] Initial view set to global Earth from space (first load)");
    }
  };

  const flyToDowntownView = (
    viewId: (typeof DOWNTOWN_VIEWS)[number]["id"],
    boundsOverride?: BoundingSphere | null,
  ) => {
    const viewer = viewerRef.current?.cesiumElement;
    const boundingSphere = boundsOverride ?? downtownBounds;
    const view = DOWNTOWN_VIEWS.find(candidate => candidate.id === viewId);

    if (!viewer || !boundingSphere || !view) {
      return;
    }

    setActiveView(viewId);
    viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 1.8,
      offset: view.offset,
    });
  };

  const handleTilesetError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to load the downtown tileset.";

    setSceneState("error");
    setSceneError(message);
  };

  const heatmapPalette = [
    [255, 243, 59],   // pale yellow — low
    [253, 199, 12],   // yellow
    [243, 144, 63],   // orange
    [237, 104, 60],   // bright red-orange
    [233, 62, 58],    // deep red — high
  ] as const;

  const tempToColor = (t:number, minT:number, maxT:number) => {
    const range = maxT - minT || 1;
    const n = (t - minT) / range;
    const pos = n * (heatmapPalette.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, heatmapPalette.length - 1);
    const frac = pos - lo;
    const a = heatmapPalette[lo];
    const b = heatmapPalette[hi];
    const r = Math.round(a[0] + (b[0] - a[0]) * frac);
    const g = Math.round(a[1] + (b[1] - a[1]) * frac);
    const b_ = Math.round(a[2] + (b[2] - a[2]) * frac);
    return Color.fromBytes(r, g, b_, 200);
  };

  // Smooth a grid by bilinear interpolation
  function smoothGrid(
    points: Array<{latitude:number;longitude:number;tempC:number}>,
    rows: number,
    cols: number,
    factor: number,
  ): Array<{latitude:number;longitude:number;tempC:number}> {
    const grid: number[][] = [];
    const lats: number[] = [];
    const lngs: number[] = [];

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        grid[r][c] = points[idx].tempC;
        if (r === 0) lngs.push(points[idx].longitude);
      }
      lats.push(points[r * cols].latitude);
    }

    const result: Array<{latitude:number;longitude:number;tempC:number}> = [];
    const newRows = (rows - 1) * factor + 1;
    const newCols = (cols - 1) * factor + 1;

    for (let r = 0; r < newRows; r++) {
      const origR = r / factor;
      const r0 = Math.min(Math.floor(origR), rows - 2);
      const r1 = r0 + 1;
      const fr = origR - r0;
      const lat = lats[r0] + (lats[r1] - lats[r0]) * fr;

      for (let c = 0; c < newCols; c++) {
        const origC = c / factor;
        const c0 = Math.min(Math.floor(origC), cols - 2);
        const c1 = c0 + 1;
        const fc = origC - c0;
        const lng = lngs[c0] + (lngs[c1] - lngs[c0]) * fc;

        const v00 = grid[r0][c0], v10 = grid[r0][c1];
        const v01 = grid[r1][c0], v11 = grid[r1][c1];
        const tempC = Math.round(
          v00 * (1 - fr) * (1 - fc) +
          v10 * (1 - fr) * fc +
          v01 * fr * (1 - fc) +
          v11 * fr * fc
        );

        result.push({ latitude: lat, longitude: lng, tempC });
      }
    }
    return result;
  }

  const GRID_ROWS = 8;
  const GRID_COLS = 8;
  const GRID_SPACING = 0.025;
  const SMOOTH_FACTOR = 2;

  const fetchTempPoints = async (centerLat?: number, centerLng?: number) => {
    const fetchId = ++fetchIdRef.current;
    try {
      const fallbackLat = downtownLocation ? Number(downtownLocation.latitude) : 37.7749;
      const fallbackLng = downtownLocation ? Number(downtownLocation.longitude) : -122.4194;
      const lat = centerLat ?? fallbackLat;
      const lng = centerLng ?? fallbackLng;
      if (!isFinite(lat) || !isFinite(lng)) return;

      lastFetchPosRef.current = { lat, lng };
      const resp = await fetch(
        `/api/temperature?lat=${lat}&lng=${lng}&spacing=${GRID_SPACING}&rows=${GRID_ROWS}&cols=${GRID_COLS}`
      );
      if (fetchId !== fetchIdRef.current) return; // stale — a newer fetch was started
      const data = await resp.json();
      if (fetchId !== fetchIdRef.current) return; // stale check again after JSON parse
      if (resp.ok && data.points) {
        gridSpacingRef.current = data.spacing ?? GRID_SPACING;
        const smoothed = smoothGrid(data.points, data.rows ?? GRID_ROWS, data.cols ?? GRID_COLS, SMOOTH_FACTOR);
        setTempPoints(smoothed);
        setHeatmapSuccess("Heat Map Applied");
        setTimeout(() => setHeatmapSuccess(""), 3000);
      } else {
        console.warn('[CesiumMap] Temperature API returned no points', data);
        setTempPoints([]);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        console.error('[CesiumMap] Failed to fetch temps', err);
        setTempPoints([]);
      }
    }
  };

  useEffect(() => {
    if (!showHeatmap) return;
    const pos = centerLocation;
    if (!pos) return;
    void fetchTempPoints(pos.lat, pos.lng);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeatmap, centerLocation, heatmapSettleKey]);

  // Manage heatmap classification primitives directly on the Cesium scene
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;
    const scene = viewer.scene;

    // Remove previous primitives
    heatmapPrimitivesRef.current.forEach(p => scene.primitives.remove(p));
    heatmapPrimitivesRef.current = [];

    if (!showHeatmap || tempPoints.length === 0) return;

    const temps = tempPoints.map(t => t.tempC);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const spacing = gridSpacingRef.current / SMOOTH_FACTOR;
    const half = spacing / 2;

    for (const p of tempPoints) {
      const south = Math.max(-89.9, p.latitude - half);
      const north = Math.min(89.9, p.latitude + half);
      const west = Math.max(-179.9, p.longitude - half);
      const east = Math.min(179.9, p.longitude + half);
      const cesiumColor = tempToColor(p.tempC, minT, maxT);

      const primitive = new ClassificationPrimitive({
        geometryInstances: new GeometryInstance({
          geometry: new RectangleGeometry({
            rectangle: Rectangle.fromDegrees(west, south, east, north),
          }),
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(cesiumColor),
          },
        }),
        classificationType: ClassificationType.CESIUM_3D_TILE,
      });

      scene.primitives.add(primitive);
      heatmapPrimitivesRef.current.push(primitive);
    }
    scene.requestRender();

    return () => {
      heatmapPrimitivesRef.current.forEach(p => scene.primitives.remove(p));
      heatmapPrimitivesRef.current = [];
    };
  }, [showHeatmap, tempPoints]);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) return;

    const scene = viewer.scene;
    const canvas = scene.canvas as HTMLCanvasElement;

    const handleCameraChanged = () => {
      // debounce rapid camera moves
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }

      locationDebounceRef.current = window.setTimeout(async () => {
        try {
          const centerPx = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
          const ray = viewer.camera.getPickRay(centerPx);
          let cartesian: Cartesian3 | undefined = undefined;

          // `getPickRay` can return `undefined` (e.g., when the camera is orthographic
          // or otherwise cannot produce a pick ray). Guard against that before calling
          // `scene.globe.pick`, which expects a non-undefined `Ray`.
          if (ray) {
            cartesian = scene.globe.pick(ray, scene);
          }

          if (!cartesian) {
            // fallback to camera position
            cartesian = viewer.camera.position;
          }

          const cartographic = Cartographic.fromCartesian(cartesian);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lng = CesiumMath.toDegrees(cartographic.longitude);

          setCenterLocation({ lat, lng });
          setLocating(false);
        } catch (err) {
          console.warn('[CesiumMap] center location update failed', err);
        } finally {
          setLocating(false);
        }
      }, 500);
    };

    viewer.camera.changed.addEventListener(handleCameraChanged);

    const handleMoveEnd = () => {
      lastFetchPosRef.current = null;
      setHeatmapSettleKey(k => k + 1);
    };
    viewer.camera.moveEnd.addEventListener(handleMoveEnd);

    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
      try {
        viewer.camera.changed.removeEventListener(handleCameraChanged as any);
      } catch {}
      try {
        viewer.camera.moveEnd.removeEventListener(handleMoveEnd as any);
      } catch {}
    };
  }, [viewerRef.current]);

  if (!tilesetSource) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950 px-6 text-center text-slate-200 shadow-2xl shadow-slate-950/40">
        <div className="max-w-xl space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
            Downtown Scene Unavailable
          </p>
          <h2 className="text-3xl font-semibold text-white">
            Add a Cesium Ion token or a public 3D Tiles URL.
          </h2>
          <p className="text-sm leading-7 text-slate-300">
            Set <code className="rounded bg-white/10 px-2 py-1">NEXT_PUBLIC_CESIUM_ION_TOKEN</code> to use the built-in downtown asset,
            or provide <code className="rounded bg-white/10 px-2 py-1">NEXT_PUBLIC_3DTILES_URL</code> for your own city model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/40">
      {/* Compact top-right controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-2 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent px-2 sm:px-4 pb-6 sm:pb-8 pt-2 sm:pt-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-200 backdrop-blur">
            {sceneState}
          </div>

          <button
            onClick={() => {
              if (!showHeatmap && !centerLocation && !downtownLocation) {
                setHeatmapWarning("Please search a location to apply heatmap to.");
                setTimeout(() => setHeatmapWarning(""), 3000);
                return;
              }
              setShowHeatmap(prev => !prev);
            }}
            className={`rounded-md border px-3 py-1.5 text-xs backdrop-blur transition ${
              showHeatmap
                ? 'border-orange-400/60 bg-orange-500/20 text-orange-200'
                : 'border-white/10 bg-black/40 text-slate-100 hover:bg-white/10'
            }`}
          >
            {showHeatmap ? 'Hide HeatMap' : 'HeatMap'}
          </button>

          {showHeatmap && (
            <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 backdrop-blur">
              <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-300">Low</span>
              {['#fff33b','#fdc70c','#f3903f','#ed683c','#e93e3a'].map((hex, i) => (
                <span key={i} className="inline-block h-3 w-4 rounded-[2px]" style={{ backgroundColor: hex }} />
              ))}
              <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-300">High</span>
            </div>
          )}
          {heatmapWarning && (
            <div className="rounded-md border border-yellow-400/40 bg-yellow-500/15 px-3 py-1.5 text-xs text-yellow-200 backdrop-blur">
              {heatmapWarning}
            </div>
          )}
          {heatmapSuccess && (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 backdrop-blur">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {heatmapSuccess}
            </div>
          )}
        </div>
      </div>

      {/* Center location — bottom-left, always visible */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
        {locating ? (
          <span>Locating…</span>
        ) : centerLocation ? (
          <span>{centerLocation.lat.toFixed(5)}, {centerLocation.lng.toFixed(5)}</span>
        ) : (
          <span>Center location unknown</span>
        )}
      </div>

      {sceneError ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 z-10 rounded-2xl border border-red-400/30 bg-red-950/70 px-4 py-3 text-sm text-red-100 backdrop-blur">
          {sceneError}
        </div>
      ) : null}

      <div className="h-full w-full">
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
        >
          {modelsVisible && (
            <Cesium3DTileset
              maximumScreenSpaceError={4}
              cullRequestsWhileMoving
              onError={handleTilesetError}
              onInitialTilesLoad={handleInitialTilesLoad}
              onReady={handleTilesetReady}
              onTileFailed={handleTilesetError}
              url={tilesetSource}
            />
          )}
        </Viewer>
      </div>
    </section>
  );
});

export default CesiumMap;

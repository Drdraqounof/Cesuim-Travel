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
  createWorldTerrainAsync,
  type Cesium3DTileset as Cesium3DTilesetPrimitive,
  type TerrainProvider,
  type Viewer as CesiumViewer,
  Color,
  LabelStyle,
  DistanceDisplayCondition,
} from "cesium";
import {
  Cesium3DTileset,
  type CesiumComponentRef,
  Viewer,
  Entity,
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
type RealLocation = {
  latitude: number;
  longitude: number;
  address: string;
};
type ElevationData = {
  googleElevation: number;
  cesiumElevation: number;
  difference: number;
  averageElevation: number;
  resolution: number;
};

const CesiumMap = forwardRef<CesiumMapRef, {}>(function CesiumMap(_, ref) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null);
  const tilesetRef = useRef<Cesium3DTilesetPrimitive | null>(null);
  const [sceneState, setSceneState] = useState<SceneState>("loading");
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [terrainProvider, setTerrainProvider] = useState<TerrainProvider>();
  const [downtownBounds, setDowntownBounds] = useState<BoundingSphere | null>(null);
  const [downtownLocation, setDowntownLocation] = useState<DowntownLocation | null>(null);
  const [realLocation, setRealLocation] = useState<RealLocation | null>(null);
  const [activeView, setActiveView] = useState<(typeof DOWNTOWN_VIEWS)[number]["id"]>("overview");
  const [elevationData, setElevationData] = useState<ElevationData | null>(null);
  const [elevationLoading, setElevationLoading] = useState(false);
  const [modelsVisible, setModelsVisible] = useState(true);
  const [showTemps, setShowTemps] = useState(false);
  const [tempPoints, setTempPoints] = useState<Array<{latitude:number;longitude:number;tempC:number}>>([]);
  const [centerLocation, setCenterLocation] = useState<{lat:number;lng:number} | null>(null);
  const [centerAddress, setCenterAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const locationDebounceRef = useRef<number | null>(null);
  const initialViewSetRef = useRef(false);

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

  useEffect(() => {
    let isActive = true;

    const fetchRealLocation = async () => {
      try {
        const response = await fetch("/api/geocode?location=Downtown San Francisco");
        const data = await response.json();

        if (isActive) {
          if (response.ok) {
            setRealLocation({
              latitude: data.latitude,
              longitude: data.longitude,
              address: data.address,
            });
            console.log("[CesiumMap] Real location loaded:", data.address);
          } else {
            console.warn("[CesiumMap] Failed to load real location:", data.error);
          }
        }
      } catch (error) {
        console.error("[CesiumMap] Error fetching real location:", error);
      }
    };

    void fetchRealLocation();

    return () => {
      isActive = false;
    };
  }, []);

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

  const fetchElevationData = async () => {
    if (!realLocation) {
      console.warn("[CesiumMap] Real location not loaded yet");
      return;
    }

    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      console.warn("[CesiumMap] Viewer not ready");
      return;
    }

    setElevationLoading(true);

    try {
      // Fetch Google elevation
      const googleResponse = await fetch(
        `/api/elevation?lat=${realLocation.latitude}&lng=${realLocation.longitude}`
      );
      const googleData = await googleResponse.json();

      if (!googleResponse.ok) {
        throw new Error(googleData.error || "Failed to fetch Google elevation");
      }

      // Get Cesium terrain elevation
      const cartographic = Cartographic.fromDegrees(
        realLocation.longitude,
        realLocation.latitude
      );
      const cesiumHeight = viewer.scene.sampleHeight(cartographic);

      if (cesiumHeight === undefined) {
        throw new Error("Could not sample Cesium terrain elevation");
      }

      const googleElev = googleData.googleElevation;
      const cesiumElev = cesiumHeight;
      const difference = Math.abs(googleElev - cesiumElev);
      const averageElev = (googleElev + cesiumElev) / 2;

      const combined: ElevationData = {
        googleElevation: googleElev,
        cesiumElevation: cesiumElev,
        difference,
        averageElevation: averageElev,
        resolution: googleData.googleResolution,
      };

      setElevationData(combined);

      console.log("[CesiumMap] Elevation data combined", {
        googleElevation: googleElev.toFixed(2),
        cesiumElevation: cesiumElev.toFixed(2),
        difference: difference.toFixed(2),
        averageElevation: averageElev.toFixed(2),
      });
    } catch (error) {
      console.error("[CesiumMap] Error fetching elevation data:", error);
      setElevationData(null);
    } finally {
      setElevationLoading(false);
    }
  };

  const tempToColor = (t:number) => {
    // simple blue->yellow->red scale
    if (t <= 0) return "#2b83ba";
    if (t <= 10) return "#abdda4";
    if (t <= 20) return "#ffffbf";
    if (t <= 30) return "#fdae61";
    return "#d7191c";
  };

  const fetchTempPoints = async (centerLat?: number, centerLng?: number) => {
    try {
      const lat = centerLat ?? Number(downtownLocation?.latitude ?? 37.7749);
      const lng = centerLng ?? Number(downtownLocation?.longitude ?? -122.4194);
      const resp = await fetch(`/api/temperature?lat=${lat}&lng=${lng}`);
      const data = await resp.json();
      if (resp.ok && data.points) {
        setTempPoints(data.points);
      } else {
        console.warn('[CesiumMap] Temperature API returned no points', data);
        setTempPoints([]);
      }
    } catch (err) {
      console.error('[CesiumMap] Failed to fetch temps', err);
      setTempPoints([]);
    }
  };

  useEffect(() => {
    if (!showTemps) return;
    // fetch when toggled on, center on downtown if available
    const lat = downtownLocation ? Number(downtownLocation.latitude) : undefined;
    const lng = downtownLocation ? Number(downtownLocation.longitude) : undefined;
    void fetchTempPoints(lat, lng);
  }, [showTemps, downtownLocation]);

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
          setLocating(true);
          setCenterAddress(null);

          const resp = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          const data = await resp.json();

          if (resp.ok && data.address) {
            setCenterAddress(data.address);
          } else {
            setCenterAddress(null);
          }
        } catch (err) {
          console.warn('[CesiumMap] center location update failed', err);
          setCenterAddress(null);
        } finally {
          setLocating(false);
        }
      }, 500);
    };

    viewer.camera.changed.addEventListener(handleCameraChanged);

    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
      try {
        viewer.camera.changed.removeEventListener(handleCameraChanged as any);
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
    <section className="relative min-h-[70svh] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent px-6 py-5 text-white">
        <div>
          <h2 className="mt-2 text-2xl font-semibold">3D city environment</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
            Explore Earth from space. Click "Explore Downtown" above or use the guide to fly into the downtown district and inspect the loaded city blocks.
          </p>
          <div className="mt-2 text-xs text-slate-300">
            {locating ? (
              <span>Locating…</span>
            ) : centerAddress ? (
              <span title={`${centerLocation?.lat}, ${centerLocation?.lng}`}>{centerAddress}</span>
            ) : centerLocation ? (
              <span>{centerLocation.lat.toFixed(5)}, {centerLocation.lng.toFixed(5)}</span>
            ) : (
              <span>Center location unknown</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-200 backdrop-blur">
            {sceneState}
          </div>
          <div className="pointer-events-auto rounded-md bg-black/40 px-3 py-2 text-sm text-slate-100 backdrop-blur">
            <button
              onClick={() => setShowTemps(prev => !prev)}
              className="px-2 py-1 text-sm rounded bg-white/6 hover:bg-white/10"
            >
              {showTemps ? 'Hide Temps' : 'Show Temps'}
            </button>
            <span className="ml-2 text-xs text-slate-300">{tempPoints.length ? `${tempPoints.length} points` : ''}</span>
          </div>
        </div>
      </div>

      {sceneError ? (
        <div className="pointer-events-none absolute inset-x-6 bottom-6 z-10 rounded-2xl border border-red-400/30 bg-red-950/70 px-4 py-3 text-sm text-red-100 backdrop-blur">
          {sceneError}
        </div>
      ) : null}

      <div className="h-[78svh] min-h-[620px] w-full">
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
              onError={handleTilesetError}
              onInitialTilesLoad={handleInitialTilesLoad}
              onReady={handleTilesetReady}
              onTileFailed={handleTilesetError}
              url={tilesetSource}
            />
          )}
          {showTemps && tempPoints.length > 0 && (() => {
            const temps = tempPoints.map(t => t.tempC);
            const minT = Math.min(...temps);
            const maxT = Math.max(...temps);
            const clamp = (v:number, a:number, b:number) => Math.max(a, Math.min(b, v));

            return tempPoints.map((p, idx) => {
              // Map temperature to pillar height (meters)
              const norm = (p.tempC - minT) / (maxT - minT || 1);
              const height = 50 + norm * 450; // 50m -> 500m
              const baseAltitude = 0; // leave at ground level; position cylinder center at half-height
              const centerAltitude = baseAltitude + height / 2;
              const color = Color.fromCssColorString(tempToColor(p.tempC)).withAlpha(0.9);

              return (
                <Entity
                  key={`temp-${idx}`}
                  position={Cartesian3.fromDegrees(p.longitude, p.latitude, centerAltitude)}
                  name={`Temp ${p.tempC}°C`}
                  cylinder={{
                    length: height,
                    topRadius: 30,
                    bottomRadius: 30,
                    material: color,
                    outline: true,
                    outlineColor: Color.WHITE,
                    outlineWidth: 1,
                  }}
                  label={{
                    text: `${p.tempC}°C`,
                    font: '16px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    outlineColor: Color.BLACK,
                    fillColor: Color.WHITE,
                    scale: 1.2,
                    pixelOffset: new Cartesian2(0, -Math.max(40, height / 10)),
                    distanceDisplayCondition: new DistanceDisplayCondition(0, 200000),
                  }}
                />
              );
            });
          })()}
        </Viewer>
      </div>
    </section>
  );
});

export default CesiumMap;

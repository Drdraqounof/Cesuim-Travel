"use client";

import { useRef, Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlaceSearch from "../../components/PlaceSearch";
import CityStatsDisplay, { type CityStats } from "../../components/CityStatsDisplay";
import type { CesiumMapRef } from "../../components/CesiumMap";
import { getLocations, saveLocation, setLocationLiked, isLoggedIn } from "@/lib/storage";

const CesiumMap = dynamic(() => import("../../components/CesiumMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300">
      Loading scene...
    </div>
  ),
});

function ViewerInner() {
  const cesiumRef = useRef<CesiumMapRef>(null);
  const [currentCity, setCurrentCity] = useState<CityStats | null>(null);
  const [modelsVisible, setModelsVisible] = useState(true);
  const [likeStatus, setLikeStatus] = useState<string>("");
  const [locatingMe, setLocatingMe] = useState(false);
  const searchParams = useSearchParams();

  const handleLocationFound = (latitude: number, longitude: number, name: string) => {
    const parts = name.split(",");
    const country = parts.length > 1 ? parts[parts.length - 1].trim() : undefined;

    setCurrentCity({
      name: parts[0].trim(),
      latitude,
      longitude,
      country,
    });

    cesiumRef.current?.flyToLocation(latitude, longitude, name);
  };

  const toggleModels = () => {
    cesiumRef.current?.toggleModels();
    setModelsVisible(prev => !prev);
  };

  const handleLikeCurrentLocation = async () => {
    if (!currentCity) {
      setLikeStatus("Search for a location first.");
      return;
    }

    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      setLikeStatus("Sign in to save this location.");
      setTimeout(() => setLikeStatus(""), 3000);
      return;
    }

    const locations = await getLocations();
    const existing = locations.find((location) => (
      location.name.toLowerCase() === currentCity.name.toLowerCase()
      && Math.abs(location.latitude - currentCity.latitude) < 0.00001
      && Math.abs(location.longitude - currentCity.longitude) < 0.00001
    ));

    if (existing) {
      await setLocationLiked(existing.id, true);
      setLikeStatus("Location liked and synced to dashboard.");
      return;
    }

    const description = currentCity.country
      ? `Liked from viewer · ${currentCity.country}`
      : "Liked from viewer";

    await saveLocation({
      name: currentCity.name,
      description,
      latitude: currentCity.latitude,
      longitude: currentCity.longitude,
      liked: true,
    });

    setLikeStatus("Location added to dashboard favorites.");
  };

  // Navigate from dashboard — fly to location passed via query params
  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const name = searchParams.get("name");
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        const parts = (name || `${latNum}, ${lngNum}`).split(",");
        setCurrentCity({
          name: parts[0].trim(),
          latitude: latNum,
          longitude: lngNum,
          country: parts.length > 1 ? parts[parts.length - 1].trim() : undefined,
        });
        requestAnimationFrame(() => {
          cesiumRef.current?.flyToLocation(latNum, lngNum, name || `${latNum}, ${lngNum}`);
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#12314f_0%,#08131e_35%,#02050b_72%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[8%] top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-24 right-[12%] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      {/* Top toolbar — sits above the map, no overlap */}
      <header className="relative z-20 shrink-0 px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4">
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-2 py-2 backdrop-blur-xl sm:px-3 lg:gap-3 lg:px-4 lg:py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-cyan-300 hover:text-cyan-200 transition"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="flex-1 min-w-0">
            <PlaceSearch onLocationFound={handleLocationFound} />
          </div>

          <button
            onClick={toggleModels}
            className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 backdrop-blur hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all"
          >
            {modelsVisible ? "3D On" : "3D Off"}
          </button>

          <button
            onClick={async () => {
              if (!navigator.geolocation) {
                setLikeStatus("Geolocation not supported.");
                return;
              }
              setLocatingMe(true);
              try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
                );
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                try {
                  const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                    { headers: { "User-Agent": "TerraScope-Geospatial-Viewer" } }
                  );
                  const data = await res.json();
                  if (data?.display_name) name = data.display_name;
                } catch {}

                const parts = name.split(",");
                setCurrentCity({ name: parts[0].trim(), latitude: lat, longitude: lng, country: parts.length > 1 ? parts[parts.length - 1].trim() : undefined });
                cesiumRef.current?.flyToLocation(lat, lng, name);
              } catch (err) {
                const msg = err instanceof GeolocationPositionError && err.code === 1
                  ? "Location permission denied."
                  : "Could not get location.";
                setLikeStatus(msg);
                setTimeout(() => setLikeStatus(""), 3000);
              } finally {
                setLocatingMe(false);
              }
            }}
            disabled={locatingMe}
            className="shrink-0 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {locatingMe ? "Locating…" : "My Location"}
          </button>

          <button
            onClick={handleLikeCurrentLocation}
            className="shrink-0 rounded-xl border border-pink-300/40 bg-pink-400/10 px-3 py-2 text-xs font-medium text-pink-200 transition hover:border-pink-300/70 hover:bg-pink-400/20"
          >
            Like
          </button>
        </div>
      </header>

      {/* Descriptive heading — now visible, below toolbar */}
      <div className="relative z-15 shrink-0 px-2 sm:px-3 pt-3 lg:px-4">
        <h2 className="text-xl sm:text-2xl font-semibold">3D city environment</h2>
        <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-5 sm:leading-6 text-slate-300">
          Explore Earth from space. Click &ldquo;Explore Downtown&rdquo; above or use the guide to fly into the downtown district and inspect the loaded city blocks.
        </p>
      </div>

      {/* Map fills remaining vertical space */}
      <div className="relative z-10 flex-1 px-2 pb-2 pt-2 sm:px-3 sm:pb-3 lg:px-4 lg:pb-4">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center rounded-[28px] border border-white/10 bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300">
              Loading scene...
            </div>
          }
        >
          <CesiumMap ref={cesiumRef} />
        </Suspense>
      </div>

      {likeStatus && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs text-slate-300 backdrop-blur-xl">
          {likeStatus}
        </div>
      )}

      <CityStatsDisplay stats={currentCity} />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300">
          Loading...
        </div>
      }
    >
      <ViewerInner />
    </Suspense>
  );
}

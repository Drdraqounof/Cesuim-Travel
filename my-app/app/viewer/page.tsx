"use client";

import { useRef, Suspense, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import PlaceSearch from "../../components/PlaceSearch";
import CityStatsDisplay, { type CityStats } from "../../components/CityStatsDisplay";
import type { CesiumMapRef } from "../../components/CesiumMap";
import { getLocations, saveLocation, setLocationLiked } from "@/lib/storage";

const CesiumMap = dynamic(() => import("../../components/CesiumMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70svh] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300 shadow-2xl shadow-slate-950/40">
      Loading downtown scene...
    </div>
  ),
});

export default function Home() {
  const cesiumRef = useRef<CesiumMapRef>(null);
  const [currentCity, setCurrentCity] = useState<CityStats | null>(null);
  const [modelsVisible, setModelsVisible] = useState(true);
  const [likeStatus, setLikeStatus] = useState<string>("");

  const handleLocationFound = (latitude: number, longitude: number, name: string) => {
    // Extract country from display name if available
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

  const handleLikeCurrentLocation = () => {
    if (!currentCity) {
      setLikeStatus("Search for a location first.");
      return;
    }

    const locations = getLocations();
    const existing = locations.find((location) => (
      location.name.toLowerCase() === currentCity.name.toLowerCase()
      && Math.abs(location.latitude - currentCity.latitude) < 0.00001
      && Math.abs(location.longitude - currentCity.longitude) < 0.00001
    ));

    if (existing) {
      setLocationLiked(existing.id, true);
      setLikeStatus("Location liked and synced to dashboard.");
      return;
    }

    const description = currentCity.country
      ? `Liked from viewer · ${currentCity.country}`
      : "Liked from viewer";

    saveLocation({
      name: currentCity.name,
      description,
      latitude: currentCity.latitude,
      longitude: currentCity.longitude,
      liked: true,
    });

    setLikeStatus("Location added to dashboard favorites.");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#12314f_0%,#08131e_35%,#02050b_72%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[8%] top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-24 right-[12%] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-5 py-5 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/6 px-6 py-6 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200 transition mb-2"
            >
              <svg
                className="h-4 w-4"
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
              Back to Dashboard
            </Link>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">
              Geospatial Downtown Viewer
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white lg:text-6xl">
              Explore a streaming 3D downtown environment inside the browser.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-200 lg:text-base">
              Cesium handles the globe, terrain, and 3D Tiles stream. Three.js stays installed for custom overlays,
              animated markers, or scene effects once the core city experience is locked in.
            </p>
            <div className="max-w-2xl pt-2">
              <PlaceSearch onLocationFound={handleLocationFound} />
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">Renderer</p>
              <p className="mt-2 text-base font-medium text-white">Cesium + 3D Tiles</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">Optional Env</p>
              <p className="mt-2 text-base font-medium text-white">Ion token or tileset URL</p>
            </div>
            <button
              onClick={toggleModels}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all"
            >
              <p className="text-xs uppercase tracking-[0.26em] text-cyan-300">3D Models</p>
              <p className="mt-2 text-base font-medium text-white">{modelsVisible ? "Visible" : "Hidden"}</p>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleLikeCurrentLocation}
              className="rounded-xl border border-pink-300/40 bg-pink-400/10 px-4 py-2 text-sm font-medium text-pink-200 transition hover:border-pink-300/70 hover:bg-pink-400/20"
            >
              Like Current Location
            </button>
            {likeStatus && (
              <p className="text-xs text-slate-300">{likeStatus}</p>
            )}
          </div>
        </header>

        <Suspense
          fallback={
            <div className="flex min-h-[70svh] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300 shadow-2xl shadow-slate-950/40">
              Loading downtown scene...
            </div>
          }
        >
          <CesiumMap ref={cesiumRef} />
        </Suspense>

        <CityStatsDisplay stats={currentCity} />
      </section>
    </main>
  );
}

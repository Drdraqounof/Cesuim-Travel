"use client";

import { useEffect, useState } from "react";

export interface CityStats {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

export interface CityStatsDisplayProps {
  stats: CityStats | null;
}

export default function CityStatsDisplay({ stats }: CityStatsDisplayProps) {
  const [elevation, setElevation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stats) {
      setElevation(null);
      return;
    }

    setLoading(true);
    // Fetch elevation data from OpenStreetMap elevation service
    const fetchElevation = async () => {
      try {
        const response = await fetch(
          `https://api.open-elevation.com/api/v1/lookup?locations=${stats.latitude},${stats.longitude}`
        );
        const data = await response.json();
        if (data.results && data.results[0]) {
          setElevation(Math.round(data.results[0].elevation));
        }
      } catch (error) {
        console.error("Failed to fetch elevation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchElevation();
  }, [stats]);

  if (!stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-auto rounded-[24px] border border-white/10 bg-slate-950/80 p-4 sm:p-6 backdrop-blur-xl text-white sm:max-w-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-cyan-300">{stats.name}</h3>
          {stats.country && (
            <p className="text-sm text-slate-400">{stats.country}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-1">
              Latitude
            </p>
            <p className="text-sm font-medium text-white">
              {stats.latitude.toFixed(4)}°
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-1">
              Longitude
            </p>
            <p className="text-sm font-medium text-white">
              {stats.longitude.toFixed(4)}°
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3 col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-1">
              Elevation
            </p>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : elevation !== null ? (
              <p className="text-sm font-medium text-white">{elevation} m</p>
            ) : (
              <p className="text-sm text-slate-400">Unavailable</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-slate-400">
            View controls: Orbit with mouse | Zoom with scroll wheel
          </p>
        </div>
      </div>
    </div>
  );
}

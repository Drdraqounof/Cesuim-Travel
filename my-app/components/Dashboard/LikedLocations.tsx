"use client";

import { useEffect, useState } from "react";
import { getLocations } from "@/lib/storage";
import type { SavedLocation } from "@/lib/types";

interface LikedLocationsProps {
  onFlyTo?: (location: SavedLocation) => void;
}

export default function LikedLocations({ onFlyTo }: LikedLocationsProps) {
  const [likedLocations, setLikedLocations] = useState<SavedLocation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getLocations().then((all) => {
      setLikedLocations(all.filter((l) => l.liked));
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Liked Locations</h3>
          <p className="text-xs text-slate-400">Favorites from the 3D viewer</p>
        </div>
        <p className="py-4 text-center text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Liked Locations</h3>
        <p className="text-xs text-slate-400">Favorites from the 3D viewer</p>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {likedLocations.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            You currently have no liked locations.
          </p>
        ) : (
          likedLocations.map((location) => (
            <div
              key={location.id}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{location.name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {location.description || "Favorited from viewer"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </p>
              </div>
              {onFlyTo && (
                <button
                  onClick={() => onFlyTo(location)}
                  className="shrink-0 rounded-lg bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                >
                  Fly
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

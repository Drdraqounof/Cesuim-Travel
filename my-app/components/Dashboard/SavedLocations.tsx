"use client";

import { useEffect, useState } from "react";
import { getLocations, deleteLocation, toggleLikeLocation } from "@/lib/storage";
import type { SavedLocation } from "@/lib/types";

interface SavedLocationsProps {
  onFlyTo?: (location: SavedLocation) => void;
}

export default function SavedLocations({ onFlyTo }: SavedLocationsProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    latitude: "",
    longitude: "",
    elevation: "",
  });

  useEffect(() => {
    setLocations(getLocations());
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.latitude || !formData.longitude) return;

    const newLocation = {
      name: formData.name,
      description: formData.description,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      elevation: formData.elevation ? parseFloat(formData.elevation) : undefined,
    };

    const saved = saveLocation(newLocation);
    setLocations([saved, ...locations]);
    setFormData({ name: "", description: "", latitude: "", longitude: "", elevation: "" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteLocation(id);
    setLocations(locations.filter((l) => l.id !== id));
  };

  const handleToggleLike = (id: string) => {
    const updated = toggleLikeLocation(id);
    if (!updated) return;
    setLocations(locations.map(l => (l.id === id ? updated : l)));
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Saved Locations</h3>
          <p className="text-xs text-slate-400">Bookmark your favorite spots</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/20"
        >
          {isAdding ? "Cancel" : "Add Location"}
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Location name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none"
          />
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="Latitude"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none"
            />
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="Longitude"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none"
            />
          </div>
          <input
            type="number"
            step="any"
            value={formData.elevation}
            onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
            placeholder="Elevation (m) - optional"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-300/50 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={!formData.name || !formData.latitude || !formData.longitude}
            className="w-full rounded-lg bg-cyan-400 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Location
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {locations.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            No locations saved yet. Add your first location above.
          </p>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{location.name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {location.description || "No description"}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  {location.elevation ? ` · ${location.elevation}m` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onFlyTo && (
                  <button
                    onClick={() => onFlyTo(location)}
                    className="rounded-lg bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    Fly
                  </button>
                )}
                <button
                  onClick={() => handleToggleLike(location.id)}
                  title={location.liked ? "Unlike" : "Like"}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <svg
                    className={`h-4 w-4 ${location.liked ? "text-pink-400" : "text-slate-400"}`}
                    viewBox="0 0 24 24"
                    fill={location.liked ? "currentColor" : "none"}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <svg
                    className="h-4 w-4 text-slate-400 hover:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

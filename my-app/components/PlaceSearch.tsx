"use client";

import { useRef, useState } from "react";

export interface PlaceSearchProps {
  onLocationFound: (latitude: number, longitude: number, name: string) => void;
}

export default function PlaceSearch({ onLocationFound }: PlaceSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearch, setLastSearch] = useState<string>("");
  const LAST_SEARCH_KEY = "terrascope_last_search";

  // Restore persisted last search
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_SEARCH_KEY);
      if (stored) {
        setLastSearch(stored);
        if (inputRef.current) inputRef.current.value = stored;
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputRef.current?.value.trim();

    if (!query) {
      setError("Please enter a location");
      return;
    }

    setIsSearching(true);
    setError(null);
    setLastSearch(query);

    try {
      // Using OpenStreetMap Nominatim API - free geocoding, no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "TerraScope-Geospatial-Viewer",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setError("Location not found");
        setIsSearching(false);
        return;
      }

      const result = data[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      const displayName = result.display_name;

      onLocationFound(latitude, longitude, displayName);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
      try {
        localStorage.setItem(LAST_SEARCH_KEY, query);
      } catch (e) {
        /* ignore */
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Search failed";
      setError(errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-2">
      <div className="relative flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search location (e.g., San Francisco, Tokyo, Brooklyn)..."
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 transition hover:border-white/30 focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/20"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${isSearching ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {lastSearch && !error && (
        <p className="text-xs text-cyan-300">
          Last search: <span className="font-medium">{lastSearch}</span>
        </p>
      )}
    </form>
  );
}

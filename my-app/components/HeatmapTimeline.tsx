"use client";

import { useRef, useCallback } from "react";

const MARKERS = [
  { label: "Today", daysAgo: 0 },
  { label: "5d", daysAgo: 5 },
  { label: "10d", daysAgo: 10 },
  { label: "15d", daysAgo: 15 },
  { label: "20d", daysAgo: 20 },
  { label: "25d", daysAgo: 25 },
  { label: "30d", daysAgo: 30 },
];

function formatDay(daysAgo: number): string {
  if (daysAgo === 0) return "Now";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo} days ago`;
}

export default function HeatmapTimeline({
  daysAgo,
  onChange,
}: {
  daysAgo: number;
  onChange: (d: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const daysRef = useRef(daysAgo);
  daysRef.current = daysAgo;

  const constrain = (d: number) => Math.max(0, Math.min(30, Math.round(d)));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 1 : -1;
    onChange(constrain(daysRef.current + delta));
  }, [onChange]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = Math.max(0, Math.min(1, x / rect.width));
      onChange(constrain(frac * 30));
    },
    [onChange],
  );

  const pct = (daysAgo / 30) * 100;

  return (
    <div className="select-none rounded-lg border border-white/10 bg-black/70 px-3 pb-3 pt-3 backdrop-blur-md">
      <div className="mb-3 text-center text-xs font-semibold text-orange-300">
        {formatDay(daysAgo)}
      </div>

      {/* Track – capture wheel here without interfering with Cesium zoom */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        onWheel={handleWheel}
        className="relative h-3 cursor-pointer rounded-full bg-white/15 hover:bg-white/20 transition-colors active:bg-white/25"
      >
        <div
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-orange-400 shadow-lg shadow-orange-500/30 transition-all duration-100"
          style={{ left: `${pct}%`, marginLeft: "-8px" }}
        />
      </div>

      {/* Markers */}
      <div className="relative mt-2 h-4">
        {MARKERS.map((m) => {
          const leftPct = (m.daysAgo / 30) * 100;
          const isActive = m.daysAgo === daysAgo;
          return (
            <button
              key={m.daysAgo}
              onClick={() => onChange(constrain(m.daysAgo))}
              type="button"
              className={`absolute -translate-x-1/2 text-[11px] transition-colors ${
                isActive
                  ? "font-semibold text-orange-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              style={{ left: `${leftPct}%` }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

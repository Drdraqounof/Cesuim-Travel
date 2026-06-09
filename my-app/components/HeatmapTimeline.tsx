"use client";

import { useRef, useCallback, useEffect } from "react";

const MARKERS = [
  { label: "Today", daysAgo: 0 },
  { label: "Yesterday", daysAgo: 1 },
  { label: "3d", daysAgo: 3 },
  { label: "5d", daysAgo: 5 },
  { label: "Week", daysAgo: 7 },
  { label: "14d", daysAgo: 14 },
  { label: "21d", daysAgo: 21 },
  { label: "30d", daysAgo: 30 },
];

const DAY_LABELS: Record<number, string> = {
  0: "Now",
  1: "Yesterday",
};

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
  onChange: (days: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const constrain = useCallback(
    (d: number) => Math.max(0, Math.min(30, d)),
    [],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? 1 : -1;
      onChange(constrain(daysAgo + delta));
    },
    [daysAgo, onChange, constrain],
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = Math.max(0, Math.min(1, x / rect.width));
      onChange(constrain(Math.round(frac * 30)));
    },
    [onChange, constrain],
  );

  const pct = (daysAgo / 30) * 100;

  return (
    <div className="rounded-lg border border-white/10 bg-black/60 px-3 pb-2 pt-3 backdrop-blur">
      {/* Current time label */}
      <div className="mb-2 text-center text-xs font-medium text-orange-300">
        {formatDay(daysAgo)}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-1.5 cursor-pointer rounded-full bg-white/15"
      >
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-orange-400 shadow-md transition-all"
          style={{ left: `${pct}%`, marginLeft: "-7px" }}
        />
      </div>

      {/* Markers */}
      <div className="relative mt-1.5">
        {MARKERS.map((m) => {
          const leftPct = (m.daysAgo / 30) * 100;
          const isActive = m.daysAgo === daysAgo;
          return (
            <button
              key={m.daysAgo}
              onClick={() => onChange(constrain(m.daysAgo))}
              className={`absolute -translate-x-1/2 text-[10px] transition-colors ${
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

      {/* Scroll hint */}
      <div className="mt-4 text-center text-[10px] text-slate-600">
        Scroll to change day
      </div>
    </div>
  );
}

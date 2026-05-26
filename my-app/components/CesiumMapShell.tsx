"use client";

import dynamic from "next/dynamic";

const CesiumMap = dynamic(() => import("./CesiumMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[70svh] items-center justify-center rounded-[28px] border border-white/10 bg-slate-950 text-sm uppercase tracking-[0.28em] text-slate-300 shadow-2xl shadow-slate-950/40">
      Loading downtown scene...
    </div>
  ),
});

export default function CesiumMapShell() {
  return <CesiumMap />;
}
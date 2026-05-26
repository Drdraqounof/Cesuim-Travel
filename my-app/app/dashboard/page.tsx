"use client";

import Header from "@/components/Dashboard/Header";
import StatsCards from "@/components/Dashboard/StatsCards";
import NotesPanel from "@/components/Dashboard/NotesPanel";
import SavedLocations from "@/components/Dashboard/SavedLocations";
import LikedLocations from "@/components/Dashboard/LikedLocations";

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#12314f_0%,#08131e_35%,#02050b_72%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[8%] top-16 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-24 right-[12%] h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-5 py-5 lg:px-8 lg:py-8">
        <Header />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <StatsCards />
            <NotesPanel />
          </div>
          <div className="space-y-6">
            <LikedLocations />
            <SavedLocations />

            <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <p className="mt-1 text-xs text-slate-400">
                Jump to your 3D environment
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
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
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Open 3D View
                </a>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Dashboard/Header";
import StatsCards from "@/components/Dashboard/StatsCards";
import NotesPanel from "@/components/Dashboard/NotesPanel";
import SavedLocations from "@/components/Dashboard/SavedLocations";
import LikedLocations from "@/components/Dashboard/LikedLocations";
import type { SavedLocation } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();

  const handleFlyTo = (location: SavedLocation) => {
    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lng: location.longitude.toString(),
      name: location.name,
    });
    router.push(`/viewer?${params.toString()}`);
  };

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
            <LikedLocations onFlyTo={handleFlyTo} />
            <SavedLocations onFlyTo={handleFlyTo} />
          </div>
        </div>
      </section>
    </main>
  );
}

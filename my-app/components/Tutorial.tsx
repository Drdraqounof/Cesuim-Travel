"use client";

import { useState } from "react";
import { markTutorialCompleted } from "@/lib/storage";

const steps = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Welcome to TerraScope",
    description: "Your geospatial intelligence platform for exploring Earth in immersive 3D. Pan across the globe to discover places — the viewer automatically identifies your current view and shows you where you are.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Search & Discover",
    description: "Search any city or landmark to fly there instantly. As you pan around, the bottom-left overlay shows the country:city name, elevation, and coordinates of wherever you're looking. Click 'More Details' to see the full address.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Fun Facts",
    description: "Every location loads an interesting fact in the bottom-left overlay. Famous places like Tokyo or Paris have multiple curated facts that rotate randomly. Obscure spots get AI-generated facts, double-checked for accuracy.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: "3D City Viewer",
    description: "Toggle detailed 3D building models on/off, explore high-fidelity city environments, and apply a temperature heatmap overlay. Use My Location to fly to your GPS position.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    title: "Save & Organize",
    description: "Bookmark your favorite spots, like locations, and add personal notes. Everything syncs to your dashboard for easy access later.",
  },
];

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const handleComplete = async () => {
    await markTutorialCompleted();
    onComplete();
  };

  const handleSkip = async () => {
    await markTutorialCompleted();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300">
            {current.icon}
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            {current.title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {current.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-cyan-400"
                  : i < step
                  ? "w-1.5 bg-cyan-400/40"
                  : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
            >
              Back
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={handleSkip}
            className="rounded-xl px-4 py-2.5 text-sm text-slate-400 transition hover:text-white"
          >
            Skip
          </button>

          <button
            onClick={step < steps.length - 1 ? () => setStep(step + 1) : handleComplete}
            className="rounded-xl border border-cyan-300/40 bg-cyan-400/20 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-400/30"
          >
            {step < steps.length - 1 ? "Next" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}

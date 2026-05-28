"use client";

import Link from "next/link";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  window.location.href = "/login";
}

export default function Header() {
  return (
    <header className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/6 px-6 py-6 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10">
          <svg
            className="h-6 w-6 text-cyan-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3h.01M17 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            TerraScope
          </h1>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
            Environmental Dashboard
          </p>
        </div>
      </div>

      <nav className="flex gap-3">
        <Link
          href="/viewer"
          className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
        >
          <span className="flex items-center gap-2">
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
            3D Environment
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-200 transition hover:border-red-300/40 hover:bg-red-500/20"
        >
          Sign Out
        </button>
      </nav>
    </header>
  );
}
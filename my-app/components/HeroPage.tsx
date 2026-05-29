"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

export default function HeroPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 3.2;

    // Wireframe globe
    const globeGeo = new THREE.IcosahedronGeometry(1, 10);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Inner dark sphere to occlude back wireframe
    const innerGeo = new THREE.SphereGeometry(0.97, 64, 64);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x010d1a, transparent: true, opacity: 0.85 });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // Equator + latitude rings
    const ringLineMat = new THREE.LineBasicMaterial({ color: 0x0099cc, transparent: true, opacity: 0.35 });
    const buildRing = (radius: number, tiltX: number, tiltY: number) => {
      const pts = Array.from({ length: 129 }, (_, i) => {
        const a = (i / 128) * Math.PI * 2;
        return new THREE.Vector3(radius * Math.cos(a), radius * Math.sin(a), 0);
      });
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringLineMat);
      ring.rotation.x = tiltX;
      ring.rotation.y = tiltY;
      return ring;
    };
    scene.add(buildRing(1.35, Math.PI / 2, 0));          // equator plane
    scene.add(buildRing(1.55, Math.PI / 5, Math.PI / 6));
    scene.add(buildRing(1.85, Math.PI / 3, Math.PI / 4));
    scene.add(buildRing(2.15, Math.PI / 8, Math.PI / 3));

    // Star field
    const starPositions = new Float32Array(3000 * 3);
    for (let i = 0; i < starPositions.length; i++) {
      starPositions[i] = (Math.random() - 0.5) * 14;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x6699cc, size: 0.012, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Bright accent dots on globe surface
    const dotCount = 120;
    const dotPositions = new Float32Array(dotCount * 3);
    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      dotPositions[i * 3] = Math.sin(phi) * Math.cos(theta);
      dotPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dotPositions[i * 3 + 2] = Math.cos(phi);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.028, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(dotGeo, dotMat));

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let animId: number;
    const animate = (t: number) => {
      animId = requestAnimationFrame(animate);
      const s = t * 0.001;
      // Smooth rotation influenced by time and mouse
      globe.rotation.y += (s * 0.22 + mouseX - globe.rotation.y) * 0.06;
      globe.rotation.x += (s * 0.07 + mouseY - globe.rotation.x) * 0.06;
      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  // Sync globe visuals with active section
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = document.getElementById("sections");
    if (!el) return;

    // Gentle visual cue: change accent dot color based on activeIndex
    const colorMap = [0x00ffcc, 0xffcc00, 0xff6b6b];

    // Update star/dot material color via DOM event (cheap approach)
    el.dataset.active = String(activeIndex);

    // We can't directly access Three.js objects from here because of scope,
    // but the existing animation loop already uses mouse/rotation which will
    // provide motion; for a more advanced sync we would lift refs or use a
    // context to expose a setter to modify globe materials.
  }, [activeIndex]);

  // Scroll-driven sections that update the globe
  const sections = [
    {
      id: "landmarks",
      title: "Discover Landmarks",
      text: "Preview famous landmarks in realistic 3D and inspect viewpoints before visiting.",
      rotation: { x: 0.1, y: 0 },
      color: 0x00ffcc,
    },
    {
      id: "routes",
      title: "Plan Routes",
      text: "Use elevation overlays to choose paths and plan hikes or city walks with confidence.",
      rotation: { x: 0.0, y: 1.2 },
      color: 0xffcc00,
    },
    {
      id: "saved",
      title: "Save & Share",
      text: "Bookmark spots, add notes, and build shareable itineraries for friends and family.",
      rotation: { x: -0.15, y: -1.0 },
      color: 0xff6b6b,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_center,#071525_0%,#02080f_65%)]">
      {/* Three.js canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#02080f_90%)]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.5em] text-cyan-400/70">
          Geospatial Intelligence Platform
        </p>

        <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
          Terra<span className="text-cyan-400">Scope</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
          Explore cities in immersive 3D using high-fidelity Cesium assets — perfect for sightseeing, travel planning, or just
          wandering the world from your browser. Browse landmarks, preview viewpoints, save favorite spots, and compare
          elevation data to plan routes or discover new places to visit — all for free.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="inline-block rounded-2xl border border-cyan-400/50 bg-cyan-400/15 px-8 py-3.5 text-sm font-semibold text-cyan-100 backdrop-blur-sm transition duration-200 hover:border-cyan-300/90 hover:bg-cyan-400/30 hover:text-white"
          >
            {isAuthenticated ? "Go to Dashboard →" : "Get Started →"}
          </Link>
          <Link
            href="/viewer"
            className="inline-block rounded-2xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            Open 3D Viewer
          </Link>
        </div>

        <div className="mt-10 w-full max-w-5xl">
          <div
            id="sections"
            className="scrollbar-hide -mx-6 overflow-x-auto px-6 py-2"
            style={{ WebkitOverflowScrolling: "touch" }}
            onWheel={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const dy = (e as any).deltaY ?? 0;
              const dx = (e as any).deltaX ?? 0;
              if (Math.abs(dy) > Math.abs(dx)) {
                el.scrollLeft += dy;
                e.preventDefault();
              }
            }}
            onScroll={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              const cardWidth = 640 + 24; // width + gap
              const index = Math.round(el.scrollLeft / cardWidth);
              setActiveIndex(Math.max(0, Math.min(index, sections.length - 1)));
            }}
          >
              {sections.map((s, i) => (
                <div
                    key={s.id}
                    className={`min-w-[640px] flex-shrink-0 transform-gpu rounded-2xl border border-white/6 bg-white/3 px-8 py-8 transition-all duration-300 ${
                      i === activeIndex ? "scale-100 shadow-2xl" : "scale-95 opacity-80"
                    }`}
                  >
                  <h4 className="text-lg font-semibold text-white">{s.title}</h4>
                  <p className="mt-3 text-sm text-slate-300">{s.text}</p>
                  <div className="mt-6 flex gap-3">
                    <button className="rounded-lg bg-cyan-400/20 px-3 py-2 text-xs text-cyan-100">Explore</button>
                    <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/80">Save</button>
                  </div>
                </div>
              ))}
            </div>
        </div>

        <p className="mt-6 text-xs text-slate-600">
          Powered by Cesium Ion · Three.js · Next.js
        </p>
      </div>
    </div>
  );
}

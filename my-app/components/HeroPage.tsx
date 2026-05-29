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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#072733] via-[#0a3b46] to-[#032429] text-white">
      {/* Scanline + grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
          backgroundSize: '100% 3px, 4px 4px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Subtle vignette (lightened) */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top_right,transparent_20%,#00000040_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left editorial column */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-cyan-400/80 font-dm-sans">
              Geospatial Intelligence Platform
            </p>

            <h1 className="font-syne text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight text-white">
              Terra
              <span className="text-cyan-300">Scope</span>
            </h1>

            <p className="mt-6 max-w-xl text-slate-100 font-dm-sans">
              Explore cities in immersive 3D using high-fidelity Cesium assets — editorially curated viewpoints, route
              previews, and shareable itineraries. A premium sightseeing experience from your browser.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-3 rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-semibold shadow-lg hover:bg-cyan-200 transition text-black"
              >
                {isAuthenticated ? "Open Dashboard" : "Get Started"}
              </Link>

              <Link
                href="/viewer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm text-white/95 hover:bg-white/8 transition"
              >
                Open 3D Viewer
              </Link>
            </div>

            {/* Floating stat strip */}
            <div className="mt-10 flex flex-col gap-3">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold" aria-hidden>
                    <AnimatedNumber value={1200} />
                  </span>
                  <span className="text-xs text-slate-400">Landmarks explored</span>
                </div>
                <div className="h-10 w-px bg-white/6" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">
                    <AnimatedNumber value={340} />
                  </span>
                  <span className="text-xs text-slate-400">Saved itineraries</span>
                </div>
              </div>

              {/* Feature list with connector */}
              <div className="mt-6 flex">
                <div className="mr-4 flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full bg-cyan-400/90" />
                  <div className="w-px flex-1 bg-white/6" />
                </div>
                <ul className="space-y-4">
                  {sections.map((s, i) => (
                    <li key={s.id} className="opacity-90">
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 max-w-lg">{s.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right globe column */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-[#0e3b45] to-[#07242b] p-6 shadow-2xl">
              <div className="relative h-72 lg:h-96 rounded-2xl overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <div className="absolute left-4 top-4 rounded-md bg-black/30 px-3 py-1 text-xs font-semibold">
                  Live preview
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-slate-500">Powered by Cesium Ion · Three.js · Next.js</p>
      </div>
    </div>
  );
}

// Small animated number component
function AnimatedNumber({ value }: { value: number }) {
  const [num, setNum] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const to = value;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setNum(Math.floor(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{num.toLocaleString()}</>;
}


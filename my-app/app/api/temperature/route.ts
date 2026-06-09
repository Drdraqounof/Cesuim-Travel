import { NextResponse } from 'next/server';

type TempPoint = {
  latitude: number;
  longitude: number;
  tempC: number;
};

type ApiResponse = {
  points: TempPoint[];
  spacing: number;
  rows: number;
  cols: number;
};

// ── rate limiter (sliding window, ≤55 RPM) ──────────────────────
const requestTimestamps: number[] = [];
const RPM_LIMIT = 55;
const WINDOW_MS = 60_000;
let rateLimitWarned = false;

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RPM_LIMIT) return false;
  requestTimestamps.push(now);
  return true;
}

// ── in-memory cache (grid results keyed by location + day) ─────
const cache = new Map<string, { points: TempPoint[]; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function cacheKey(lat: number, lng: number, rows: number, cols: number, spacing: number, daysAgo: number): string {
  return `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100},${rows},${cols},${spacing},d${daysAgo}`;
}

function getCached(key: string): TempPoint[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.points;
}

// ── route handler ───────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat') ?? '37.7749');
    const lng = Number(url.searchParams.get('lng') ?? '-122.4194');
    const spacing = Math.max(0.005, Math.min(0.1, Number(url.searchParams.get('spacing') ?? '0.02')));
    const rows = Math.max(3, Math.min(32, Number(url.searchParams.get('rows') ?? '3')));
    const cols = Math.max(3, Math.min(32, Number(url.searchParams.get('cols') ?? '3')));
    const daysAgo = Math.max(0, Math.min(365, Number(url.searchParams.get('daysAgo') ?? '0')));

    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
    let points: TempPoint[];

    if (apiKey) {
      const key = cacheKey(lat, lng, rows, cols, spacing, daysAgo);
      const cached = getCached(key);
      if (cached) {
        points = cached;
      } else {
        const keyValid = await validateApiKey(apiKey);
        if (!keyValid) {
          points = generateDemoPoints(lat, lng, rows, cols, spacing, daysAgo);
        } else {
          points = await fetchFromOpenWeatherMap(lat, lng, rows, cols, spacing, apiKey);
        }
        cache.set(key, { points, ts: Date.now() });
        rateLimitWarned = false;
      }
    } else {
      points = generateDemoPoints(lat, lng, rows, cols, spacing, daysAgo);
    }

    return NextResponse.json({ points, spacing, rows, cols } satisfies ApiResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate temperature points';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Pre-check API key with a single cell ──────────────────────
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const resp = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=0&lon=0&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`,
      { signal: AbortSignal.timeout(5000) },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

// ── OpenWeatherMap with per-cell rate limiting ──────────────────
async function fetchFromOpenWeatherMap(
  centerLat: number,
  centerLng: number,
  rows: number,
  cols: number,
  spacing: number,
  apiKey: string,
): Promise<TempPoint[]> {
  const results: TempPoint[] = [];
  const succeeded: { r: number; c: number; tempC: number }[] = [];

  for (let r = 0; r < rows; r++) {
    const rowLat = centerLat + (r - Math.floor(rows / 2)) * spacing;

    for (let c = 0; c < cols; c++) {
      const colLng = centerLng + (c - Math.floor(cols / 2)) * spacing;

      if (!checkRateLimit()) {
        if (!rateLimitWarned) {
          console.warn('[temperature] Rate limit reached — filling remaining cells with estimates');
          rateLimitWarned = true;
        }
        // Estimate from nearby successful cells or use fallback
        const estimate = estimateCellTemp(rowLat, colLng, succeeded, centerLat, centerLng);
        results.push({ latitude: rowLat, longitude: colLng, tempC: estimate });
        continue;
      }

      try {
        const resp = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${rowLat}&lon=${colLng}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`,
          { signal: AbortSignal.timeout(4000) },
        );

        if (!resp.ok) {
          console.warn('[temperature] OWM request failed', resp.status, resp.statusText);
          const tempC = 20;
          results.push({ latitude: rowLat, longitude: colLng, tempC });
          succeeded.push({ r, c, tempC });
          continue;
        }

        const data = await resp.json();
        const tempC = Math.round(data.current?.temp ?? 20);
        results.push({ latitude: rowLat, longitude: colLng, tempC });
        succeeded.push({ r, c, tempC });
      } catch {
        console.warn('[temperature] OWM fetch error for cell', r, c);
        const tempC = 20;
        results.push({ latitude: rowLat, longitude: colLng, tempC });
        succeeded.push({ r, c, tempC });
      }
    }
  }

  return results;
}

/** Estimate a cell's temperature from nearby successfully-fetched cells. */
function estimateCellTemp(
  lat: number,
  lng: number,
  succeeded: { r: number; c: number; tempC: number }[],
  _centerLat: number,
  _centerLng: number,
): number {
  if (succeeded.length === 0) return 20;

  // Weighted by inverse distance
  let weightedSum = 0;
  let weightTotal = 0;
  for (const s of succeeded) {
    const d = Math.hypot(s.r, s.c);
    if (d < 0.01) return s.tempC;
    const w = 1 / d;
    weightedSum += s.tempC * w;
    weightTotal += w;
  }
  return Math.round(weightedSum / weightTotal);
}

// ── demo fallback ───────────────────────────────────────────────
function generateDemoPoints(
  centerLat: number,
  centerLng: number,
  rows: number,
  cols: number,
  spacing: number,
  daysAgo: number = 0,
): TempPoint[] {
  const points: TempPoint[] = [];
  // Deterministic day-to-day weather variation
  const dayAngle = daysAgo * 0.7;
  const baseShift = Math.sin(dayAngle) * 4 + Math.cos(daysAgo * 0.3) * 2;
  const gradientAngle = Math.sin(daysAgo * 0.5) * 0.5;
  const noiseScale = 1 + Math.abs(Math.cos(daysAgo * 1.1)) * 1.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetLat = (r - Math.floor(rows / 2)) * spacing;
      const offsetLng = (c - Math.floor(cols / 2)) * spacing;
      const cellNoise = Math.sin(r * 2.3 + c * 1.7 + daysAgo * 1.1) * noiseScale;
      const gradient = (r * Math.cos(gradientAngle) + c * Math.sin(gradientAngle)) * 1.5;
      const tempC = Math.round(15 + (r - c) * 2 + baseShift + gradient + cellNoise);

      points.push({
        latitude: centerLat + offsetLat,
        longitude: centerLng + offsetLng,
        tempC,
      });
    }
  }

  return points;
}

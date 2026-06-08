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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat') ?? '37.7749');
    const lng = Number(url.searchParams.get('lng') ?? '-122.4194');
    const spacing = Math.max(0.005, Math.min(0.1, Number(url.searchParams.get('spacing') ?? '0.02')));
    const rows = Math.max(3, Math.min(32, Number(url.searchParams.get('rows') ?? '3')));
    const cols = Math.max(3, Math.min(32, Number(url.searchParams.get('cols') ?? '3')));

    if (!isFinite(lat) || !isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
    let points: TempPoint[];

    if (apiKey) {
      points = await fetchFromOpenWeatherMap(lat, lng, rows, cols, spacing, apiKey);
    } else {
      points = generateDemoPoints(lat, lng, rows, cols, spacing);
    }

    return NextResponse.json({ points, spacing, rows, cols } satisfies ApiResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate temperature points';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchFromOpenWeatherMap(
  centerLat: number,
  centerLng: number,
  rows: number,
  cols: number,
  spacing: number,
  apiKey: string,
): Promise<TempPoint[]> {
  const results: TempPoint[] = [];

  for (let r = 0; r < rows; r++) {
    const rowLat = centerLat + (r - Math.floor(rows / 2)) * spacing;

    for (let c = 0; c < cols; c++) {
      const colLng = centerLng + (c - Math.floor(cols / 2)) * spacing;

      try {
        const resp = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${rowLat}&lon=${colLng}&exclude=minutely,hourly,daily,alerts&units=metric&appid=${apiKey}`,
          { signal: AbortSignal.timeout(4000) },
        );

        if (!resp.ok) {
          console.warn('[temperature] OWM request failed', resp.status, resp.statusText);
          results.push({ latitude: rowLat, longitude: colLng, tempC: 20 });
          continue;
        }

        const data = await resp.json();
        const tempC = Math.round(data.current?.temp ?? 20);
        results.push({ latitude: rowLat, longitude: colLng, tempC });
      } catch {
        console.warn('[temperature] OWM fetch error for cell', r, c);
        results.push({ latitude: rowLat, longitude: colLng, tempC: 20 });
      }
    }
  }

  return results;
}

function generateDemoPoints(
  centerLat: number,
  centerLng: number,
  rows: number,
  cols: number,
  spacing: number,
): TempPoint[] {
  const points: TempPoint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetLat = (r - Math.floor(rows / 2)) * spacing;
      const offsetLng = (c - Math.floor(cols / 2)) * spacing;
      const tempC = Math.round(15 + (r - c) * 2 + (Math.random() - 0.5) * 3);

      points.push({
        latitude: centerLat + offsetLat,
        longitude: centerLng + offsetLng,
        tempC,
      });
    }
  }

  return points;
}
